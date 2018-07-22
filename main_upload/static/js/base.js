$(document).ready(function(){
  offset = $(window).height() * 0.8
  $( window ).scroll(function(){
    let currentPosition = $(document).scrollTop()
    if(currentPosition > offset){
      $("nav").addClass("activatedNav")
    }else{
      $("nav").removeClass("activatedNav")
    }
  })
  $(".iconsContainer img").click(()=>{
    $("body, html").animate({
      "scrollTop": 0
    }, 800)
  })
})