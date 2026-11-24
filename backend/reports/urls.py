from django.urls import path
from .views import (
    AnalyticsSummaryView,
    ExportCSVReportView,
    ExportPDFReportView
)

urlpatterns = [
    path('summary/', AnalyticsSummaryView.as_view(), name='reports-summary'),
    path('export/csv/', ExportCSVReportView.as_view(), name='reports-export-csv'),
    path('export/pdf/', ExportPDFReportView.as_view(), name='reports-export-pdf'),
]
