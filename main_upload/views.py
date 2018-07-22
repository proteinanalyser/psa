from django.views import generic 
from django.shortcuts import render, redirect
from django.http.response import HttpResponse, HttpResponseRedirect
from django.http import JsonResponse
from django.views.generic import TemplateView
from .models import UploadFile
from django.contrib.staticfiles.templatetags.staticfiles import static
import pandas as pd
import os
import json
import numpy as np


class IndexView(generic.ListView):
  template_name = "upload.html"

  def get_queryset(self):
    return None


class UploadFileView(generic.ListView):
    template_name = "ready.html"

    def get(self, request): 
        return render(request, 'upload.html',{
                'error_msg': "Unauthorized access!"
        })

    def post(self, request):
        received_json = json.loads(request.body.decode('utf-8'))

        if received_json["error"] == True: 
            print( received_json["msg"])
            return redirect('/', permanent=True) 

        data = received_json["data"]["input_attributes"]
        sample_names = received_json["data"]["sample_names"]
        input_attributes = []

        for key in data:
            input_attributes.append( data[key])

        predictions = self.estimate(np.array(input_attributes), sample_names)
        
        current_dir = os.path.dirname(os.path.realpath(__file__))
        detailed_excel= os.path.join(current_dir, "static", "temp", "detailed.xlsx")
        condensed_excel =  os.path.join(current_dir, "static", "temp", "condensed.xlsx")
        
        pd.DataFrame.from_dict(predictions).to_excel(detailed_excel)
        pd.DataFrame.from_dict(self.getSummaryData(predictions)).to_excel(condensed_excel)
        return HttpResponse( json.dumps(predictions))

    def get_queryset(self):
        return None

    def estimate(self, input_attributes, sample_names):
        from keras.models import model_from_json 	
        from keras import backend as K

        def compile_model(model):
            model.compile(loss='mse', optimizer="adam", metrics=['accuracy'])
            return model

        def model_print_predictions(model, input_attributes, ids):
            previsoes = model.predict(input_attributes)
            
            save_predictions = {}
            classes= [ "3-10_helix","alpha_helix", "bend", "beta_bridge", "beta_strand", "bonded_turn", "loop_or_irregular", "pi_helix"]
            for j, prev in enumerate(previsoes):
                save_predictions[ids[j]] = {}
                for i in range(len(classes)):
                    save_predictions[ids[j]][classes[i]] = float(prev[i]*100)    
            return save_predictions
            
        def load_model_json():
            current_file_dir = os.path.dirname(__file__)
            json_file = open(os.path.join(current_file_dir,"static/model.json"), 'r')
            loaded_model_json = json_file.read()
            json_file.close()
            return model_from_json(loaded_model_json)

        def load_weights_hdf5(model):
            current_file_dir = os.path.dirname(__file__)
            model.load_weights(os.path.join(current_file_dir,"static/weights.hdf5"))

        def extract_atributes(file_to_extract): 
            input_attributes = pd.read_excel(file_to_extract).transpose().values
            sample_names =  pd.read_excel(file_to_extract).columns
            return (input_attributes, sample_names)

        model = load_model_json()
        load_weights_hdf5(model)
        compile_model(model)
    
        # (input_attributes, sample_names) = extract_atributes(received_file) 
        results = model_print_predictions(model, input_attributes, sample_names)
        K.clear_session()
        return results

    def getSummaryData(self, detailed_data):
        summuryResults = {}
        for sample in detailed_data:
            summuryResults[sample] = {
                "alpha_helix": detailed_data[sample]["3-10_helix"] + detailed_data[sample]["alpha_helix"],
                "beta_strand": detailed_data[sample]["beta_bridge"] + detailed_data[sample]["beta_strand"],
                "random_coil": detailed_data[sample]["bend"] + detailed_data[sample]["bonded_turn"] + detailed_data[sample]["loop_or_irregular"] + detailed_data[sample]["pi_helix"]
            }
        return summuryResults


class InstructionsView(generic.ListView):
    template_name = "instructions.html"
    
    def get_queryset(self):
        return None

class WorkView(generic.ListView):
    template_name = "work.html"
    
    def get_queryset(self):
        return None

def unload(request):
    current_dir = os.path.dirname(os.path.realpath(__file__))
    os.remove(os.path.join(current_dir, "static", "temp", "detailed.xlsx"))
    os.remove(os.path.join(current_dir, "static", "temp", "condensed.xlsx"))
    return HttpResponse("Done")
