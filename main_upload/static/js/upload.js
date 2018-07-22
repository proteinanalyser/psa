$(document).ready(function () {
  $(".goUploadContainer").click(() => {
    $("body, html").animate({
      "scrollTop": $(".uploadContainer").position().top
    }, 800)
  });

  var excelFile, detailedChart = {}, sumChart = {}, summuryResults = {};
  
  $("#uploadFile").change(function (event) {
    files = event.target.files;
    excelFile = files[0];
    let reader = new FileReader();
    if (excelFile) {
      reader.readAsDataURL(excelFile);
    } else {
      console.log("Ocorreu um erro")
    }
    reader.onloadend = function () {
      $(".contentContainer").addClass("nextLeft")
    }
  })

  $("body").on("transitionend", ".contentContainer", function () {
    $(this).css("display", "none")
    $(".submitContainer").removeClass("nextRight")
  })

  $("body").on("click", ".tryAgainBtn", function () {
    $(".blackContainer, .errorContainer").addClass("hide")
    location.reload()
  })

  $("body").on("click", ".blackContainer", function () {
    $(".blackContainer, .errorContainer").addClass("hide")
  })

  $(".submitBtn").click(function () {
    $(".warningContainer").removeClass("hide")
    $(".submitContainer h1").addClass("hide")
  })

  $(".confirmSubmit").click(function () {
    $(".submitContainer h1").html("Analysing...").removeClass("hide")
    $(".warningContainer").addClass("hide")
    $(".submitBtn").addClass("loadAnimation");
  });

  $(".cancelSubmit").click(function () {
    location.reload()
  });

  $("#uploadForm").submit(function (e) {
    e.preventDefault()
    var formData = new FormData();
    formData.append('uploadFile', document.getElementById('uploadFile').files[0]);
    fetch('https://excelparser.herokuapp.com/parse_excel', {
      method: 'POST',
      body: formData
    }).then(
      response => response.json()
    ).then(
      success => {
        if(success.error == true){
          $(".errorDialog .msg").html(success.msg)
          $(".blackContainer, .errorContainer").removeClass("hide")
        }else{
          sendReceivedData(success)
        }
        
      }
    ).catch(
      error => console.log(error)
    );
  })

  $(".exportCondensed").click(function(){
    exportExcel(sumChart, "condensed_results.xlsx")
  });

  $(".exportDetailed").click(function(){
    exportExcel(detailedChart, "detailed_results.xlsx")
  });

  let sendReceivedData = (send_json) => {
    fetch($("#uploadForm").attr("action"), {
      method: 'POST',
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(send_json)
    }).then(
      response => response.json()
    ).then(
      results => {
        $(".uploadContainer").addClass("hide").css({"height":"0", "display":"none"})
        $(".resultsContainer").removeClass("hide")
        updateGraph(results)
      }
    ).catch(
      error => console.log(error)
    )
  }

  let getCookie = (name) =>{
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = jQuery.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  let updateGraph = (predictions) => {
    var samples = Object.keys(predictions);
    var structures = Object.keys(predictions[samples[0]]);
    var ctx = document.getElementById("chart").getContext('2d');
    var myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: samples,
        datasets: []
      },
      options: {
        legend: {
          position: "bottom",
          labels: {
            fontColor: 'white'
          }
        },
        scales: {
          yAxes: [{
            ticks: {
              fontColor: 'white'
            },
          }],
          xAxes: [{
            ticks: {
              fontColor: 'white'
            },
          }]
        }

      }
    });
    for (i = 0; i < structures.length; i++) {
      detailedChart[structures[i]] = []
      for (j = 0; j < samples.length; j++) {
        detailedChart[structures[i]].push(predictions[samples[j]][structures[i]])
      }
    }
    for (var k = 0; k < samples.length; k++) {
      $(".structuresContainer").append(`
            <th class="tableTitle">${samples[k]}</th>
        `);
      var currentSample = samples[k]
      summuryResults[currentSample] = {
        "alpha_helix": predictions[currentSample]["3-10_helix"] + predictions[currentSample]["alpha_helix"],
        "beta_strand": predictions[currentSample]["beta_bridge"] + predictions[currentSample]["beta_strand"],
        "random_coil": predictions[currentSample]["bend"] + predictions[currentSample]["bonded_turn"] + predictions[currentSample]["loop_or_irregular"] + predictions[currentSample]["pi_helix"]
      }
    }
    var sumStructure = ["alpha_helix", "beta_strand", "random_coil"]
    var colors = ["#2ecc71", "#2980b9", "#c0392b", "#e67e22", "#f1c40f", "#16a085", "#8e44ad", "#ED4C67"];
    for (i = 0; i < sumStructure.length; i++) {
      sumChart[sumStructure[i]] = []
      $(".resultsTable").append(`
        <tr class="${sumStructure[i]}">
            <th class="structures">${sumStructure[i]}</th>
        </tr>
        `)
      for (j = 0; j < samples.length; j++) {

        $(`.${sumStructure[i]}`).append(`
                <th>${summuryResults[samples[j]][sumStructure[i]].toFixed(2)}</th>
            `)
        sumChart[sumStructure[i]].push(summuryResults[samples[j]][sumStructure[i]])
      }
      myChart.data.datasets.push({
        label: sumStructure[i],
        data: sumChart[sumStructure[i]],
        borderColor: colors[i]
      });
    }
    myChart.update();
  }

  let exportExcel = (json, filename) =>{
    let info = extractedInfo(Object.keys(summuryResults), json);
    var wb = XLSX.utils.book_new()
    var ws = XLSX.utils.json_to_sheet(info.exportData, {header: info.header, skipHeader: false});
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename)
  }

  const extractedInfo = (samples, json) =>{
    let columns = ["Structures"];
    let data = []

    columns = columns.concat(samples)
    num_samples = Object.keys(json).length;
    for(var i = 0; i<num_samples; i++){
      let results = {}, currentStructure = Object.keys(json)[i];
      results[columns[0]] = currentStructure;
      for(var j = 1; j<columns.length; j++){
        results[columns[j]] = json[currentStructure][j-1]
      }
      data.push(results)
    }
    return {
      header: columns, 
      exportData: data
    }; 
  }
})
