$(document).ready(function () {
    $("nav").css("background", "#040c26")
    var samples = Object.keys(predictions);
    var structures = Object.keys(predictions[samples[0]]);
    var detailedChart = {}
    var summuryResults = {}
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
    var sumChart = {}
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

})

$(window).on("unload",function(){
    jQuery.ajax({url:"http://localhost:8000/upload_file/unload/", async:false})
});