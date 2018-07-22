import matplotlib.pyplot as plt
import numpy as np 
import keras
from keras.models import Sequential 
from keras.layers import Dense 
from keras.models import model_from_json 
from keras.models import model_from_yaml
from keras.layers import Dropout	
from keras import optimizers
import pandas as pd
from keras.callbacks import ModelCheckpoint

seed = 9
np.random.seed(seed)

def create_model():
  architecture = Sequential()
  architecture.add(Dense(61, input_dim=61, activation="tanh", kernel_initializer="normal"))
  architecture.add(Dense(45, activation="tanh", kernel_initializer="normal"))
  architecture.add(Dropout(0.1))
  architecture.add(Dense(8, activation="softmax", kernel_initializer="normal"))
  return architecture

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
      print("%% of %s - %.6f%%"% (classes[i], prev[i]*100))
      save_predictions[ids[j]][classes[i]] = prev[i]*100 
    print("\n\n")
  pd.DataFrame(save_predictions).to_excel("results/%s.xlsx"%results_name)
    

def load_weights_hdf5(model,fich):
  model.load_weights(fich)
  print("Loaded model from disk")

def load_model_json(fich):
  json_file = open(fich, 'r')
  loaded_model_json = json_file.read()
  json_file.close()
  loaded_model = model_from_json(loaded_model_json)
  return loaded_model

def extract_atributes(file): 
  dataset = pd.read_excel(file).transpose().values
  print(dataset.size)
  input_attributes = dataset[:,:-8]
  sample_names =  pd.read_json(file).columns
  return (input_attributes, sample_names)

def use_trained_model(file):
  model = create_model()
  load_weights_hdf5(model,"weights/weights.hdf5")
  compile_model(model)
  (input_attributes, sample_names) = extract_atributes(file) 
  # model_print_predictions(model, input_attributes, sample_names)
