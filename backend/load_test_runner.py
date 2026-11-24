import os
import sys
import time
import statistics
import concurrent.futures

# Set up Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.conf import settings
from django.test import Client
from django.contrib.sessions.backends.db import SessionStore
from django.contrib.auth import SESSION_KEY, BACKEND_SESSION_KEY, HASH_SESSION_KEY
from accounts.models import User, StudentProfile, TeacherProfile
from classrooms.models import Classroom
from gamification.models import Level, Achievement
from points.services import process_points_transaction
from points.models import PointsTransaction

def setup_load_test_environment():
    print("[Load Test Setup] Preparing 44 students (22 in Wheeler 2, 22 in Wheeler 3) and teacher...")
    w2, _ = Classroom.objects.get_or_create(name='Wheeler 2', defaults={'name_ar': 'ويلر 2'})
    w3, _ = Classroom.objects.get_or_create(name='Wheeler 3', defaults={'name_ar': 'ويلر 3'})

    # Teacher
    teacher, _ = User.objects.get_or_create(
        email='load_teacher@school.edu',
        defaults={
            'username': 'load_teacher',
            'full_name': 'Teacher Simulator',
            'role': User.ROLE_TEACHER,
            'status': User.STATUS_APPROVED
        }
    )
    teacher.set_password('Pass123!')
    teacher.save()
    tp, _ = TeacherProfile.objects.get_or_create(user=teacher)
    tp.is_approved = True
    tp.assigned_classrooms.set([w2, w3])
    tp.save()

    # Create 44 students and pre-generate their session cookies
    students_data = []
    for i in range(1, 45):
        classroom = w2 if i <= 22 else w3
        username = f"bench_student_{i}"
        email = f"student_{i}@bench.edu"
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'full_name': f"Student {i} ({'W2' if i <= 22 else 'W3'})",
                'role': User.ROLE_STUDENT,
                'status': User.STATUS_APPROVED
            }
        )
        if created:
            user.set_password('StudentPass123!')
            user.save()
            sp = StudentProfile.objects.create(
                user=user,
                classroom=classroom,
                points=10 + (i * 2),
                coins=i,
                level='مبتدئ / Beginner'
            )
        else:
            sp = user.student_profile

        # Pre-create session to avoid write bottleneck during concurrent read benchmarking
        session = SessionStore()
        session[SESSION_KEY] = str(user.pk)
        session[BACKEND_SESSION_KEY] = 'django.contrib.auth.backends.ModelBackend'
        session[HASH_SESSION_KEY] = user.get_session_auth_hash()
        session.save()

        students_data.append({
            'user': user,
            'profile': sp,
            'session_key': session.session_key
        })

    print(f"[Load Test Setup] Ready. Total students: {len(students_data)}")
    return teacher, w2, w3, students_data

def simulate_user_session(user_index, teacher, w2, w3, students_data):
    """
    Simulates a concurrent user session executing multi-endpoint requests.
    """
    client = Client()
    latencies = []
    errors = 0
    requests_count = 0

    student_data = students_data[user_index % len(students_data)]
    client.cookies[settings.SESSION_COOKIE_NAME] = student_data['session_key']

    # Endpoint 1: Leaderboard General
    t0 = time.perf_counter()
    res1 = client.get('/api/gamification/leaderboard/')
    t1 = time.perf_counter()
    latencies.append((t1 - t0) * 1000)
    requests_count += 1
    if res1.status_code != 200:
        errors += 1

    # Endpoint 2: Classroom Leaderboard (Wheeler 2)
    t0 = time.perf_counter()
    res2 = client.get(f'/api/gamification/leaderboard/?classroom_id={w2.id}')
    t1 = time.perf_counter()
    latencies.append((t1 - t0) * 1000)
    requests_count += 1
    if res2.status_code != 200:
        errors += 1

    # Endpoint 3: Student Search
    t0 = time.perf_counter()
    res3 = client.get('/api/gamification/leaderboard/?search=Student')
    t1 = time.perf_counter()
    latencies.append((t1 - t0) * 1000)
    requests_count += 1
    if res3.status_code != 200:
        errors += 1

    # Endpoint 4: Classroom Details
    t0 = time.perf_counter()
    res4 = client.get(f'/api/classrooms/{w2.id}/')
    t1 = time.perf_counter()
    latencies.append((t1 - t0) * 1000)
    requests_count += 1
    if res4.status_code != 200:
        errors += 1

    # Endpoint 5: Analytics Summary
    t0 = time.perf_counter()
    res5 = client.get('/api/reports/summary/')
    t1 = time.perf_counter()
    latencies.append((t1 - t0) * 1000)
    requests_count += 1
    if res5.status_code != 200:
        errors += 1

    # Endpoint 6: Current User Info (/api/auth/me/)
    t0 = time.perf_counter()
    res6 = client.get('/api/auth/me/')
    t1 = time.perf_counter()
    latencies.append((t1 - t0) * 1000)
    requests_count += 1
    if res6.status_code != 200:
        errors += 1

    return requests_count, errors, latencies

def run_load_test(target_concurrency=150):
    # Disable throttle limits during load benchmark
    settings.REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []

    print(f"\n========================================================")
    print(f"CLASS CHAMPIONS LOAD TESTING BENCHMARK")
    print(f"Simulating {target_concurrency} Concurrent Active Users")
    print(f"========================================================\n")

    teacher, w2, w3, students_data = setup_load_test_environment()

    start_time = time.perf_counter()
    all_latencies = []
    total_requests = 0
    total_errors = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=target_concurrency) as executor:
        futures = [
            executor.submit(simulate_user_session, i, teacher, w2, w3, students_data)
            for i in range(target_concurrency)
        ]

        for future in concurrent.futures.as_completed(futures):
            reqs, errs, lats = future.result()
            total_requests += reqs
            total_errors += errs
            all_latencies.extend(lats)

    end_time = time.perf_counter()
    total_elapsed = end_time - start_time

    # Calculate statistics
    avg_latency = statistics.mean(all_latencies) if all_latencies else 0
    median_latency = statistics.median(all_latencies) if all_latencies else 0
    all_latencies.sort()
    p95_index = int(0.95 * len(all_latencies))
    p95_latency = all_latencies[p95_index] if all_latencies else 0
    min_latency = min(all_latencies) if all_latencies else 0
    max_latency = max(all_latencies) if all_latencies else 0

    rps = total_requests / total_elapsed if total_elapsed > 0 else 0
    error_rate = (total_errors / total_requests) * 100 if total_requests > 0 else 0

    print("\n---------------- LOAD TEST RESULTS ----------------")
    print(f"Target Concurrency Level: {target_concurrency} concurrent threads")
    print(f"Total Requests Executed:  {total_requests}")
    print(f"Successful Requests:      {total_requests - total_errors}")
    print(f"Failed Requests (Errors): {total_errors}")
    print(f"Error Rate:               {error_rate:.2f}%")
    print(f"Total Wall-Clock Time:    {total_elapsed:.3f} seconds")
    print(f"Throughput (Req / Sec):   {rps:.2f} req/s")
    print(f"Average Latency:          {avg_latency:.2f} ms")
    print(f"Median Latency (p50):     {median_latency:.2f} ms")
    print(f"95th Percentile (p95):    {p95_latency:.2f} ms")
    print(f"Min Latency:              {min_latency:.2f} ms")
    print(f"Max Latency:              {max_latency:.2f} ms")
    print(f"System Stability:         {'EXCELLENT (100% Success)' if error_rate == 0 else 'WARNING'}")
    print("---------------------------------------------------\n")

if __name__ == '__main__':
    concurrency = int(sys.argv[1]) if len(sys.argv) > 1 else 150
    run_load_test(concurrency)
