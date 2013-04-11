// Custom Handler used to Handle Custom Calls and functionality
(function($){	
	$(document).ready(function(){
		$("div.btn-group input[type='button']").click(function(){
			$("#gender").attr("value", $(this).attr('id'));
		})
		var default_value = 150;
		if ($("#travel_distance").val().length > 0) {
			var default_value = $("#travel_distance").val().toFixed(0);
		}
		console.log(default_value);
		$(".distance").slider({
		    orientation: "horizontal",
		    range: "min",
		    min: 0,
		    max: 1000,
		    step: 50,
		    value: parseInt(default_value),
		    slide: function (event, ui) {
		    	var value = (ui.value < 1 ? "1" : ui.value);
		    	$("#travel_distance").val(value);
		    	if (value >= 1000) {
			    	value = "238,900";
			    	$(".distance .measurement").html("Miles. (So like between here and the moon.)");
			    	$("#travel_distance").val(-1);
		    	} else {
			    	$(".distance .measurement").html("Miles");
		    	}
		        $(".distance .echo").html(value);
		    }
		});
		var default_value = $(".distance").slider("value");
		console.log(default_value);

		$("#travel_distance").val(default_value);
		$(".distance .echo").html(default_value);
		
	});
})(jQuery)