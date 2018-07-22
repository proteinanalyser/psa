from django.urls import path
from . import views 

urlpatterns = [
  path('', views.IndexView.as_view(), name="index"),
  path('upload_file/', views.UploadFileView.as_view(), name="upload"),
  path('upload_file/unload/', views.unload, name="unload"),
  path('instructions/', views.InstructionsView.as_view(), name="instructions"),
  path('work/', views.WorkView.as_view(), name="work"),
]

