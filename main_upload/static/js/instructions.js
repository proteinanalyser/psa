$(document).ready(function(){
    $("nav").css("background", $("header").css("background"));
    $(".goRules").click(()=>{
        $("body, html").animate({
          "scrollTop": $("#rules").position().top
        }, 800)
      })
})