(function($){

    var generating = false;
        

    $.fn.data_loader = function(settings) {   
        var $that = $(this);
        settings = $.extend(true, {}, $.fn.data_loader.settings, settings || {});
        
        return this.each(function() {
            var obj = $("<div></div>");
            obj.addClass('scroll-pane');
            
            $('.kitegraph').bind("scroll", function(e){

            	var that = $(this);
            
                var max_left = parseInt(this.scrollWidth) - parseInt(this.clientWidth);
                var cur_left = that.scrollLeft();

                var generating = $(this).attr('data-generating');

                if (generating == 'false' && cur_left >= (max_left - (max_left * .4))) {

                	$(this).attr('data-generating', true);

                    if (_$local.spot_cache_obj.length != _$local.spot_cache.length) {
	                    for (var i in _$local.spot_cache) {
	                        for (var x in _$local.spot_cache[i]) {
	                            if (x != $(this).attr('id')) {
	                                continue;
	                            }
	                            for (y in _$local.spot_cache_obj) {
	                            	if (typeof _$local.spot_cache_obj[y][x] == 'undefined') {
		                            	continue;
	                            	}
		                            var graph_objects = _$local.spot_cache_obj[y][x];
	                            }
	                            var spot_id = x;                            
	                            var start = $(this).attr('data-last-point');
	                            var end = parseInt($(this).attr('data-last-point')) + 72;
	                            var max = parseInt($(this).attr('data-max-point'));
	                            // we dont want to contine past max
	                            if (start >= max) {
		                            return true;
	                            }
	                            $(this).data_loader.buildslide(_$local.spot_cache[i][x], $(this).attr('id'), start, end, graph_objects.timeline, graph_objects.winds);
	                        }
						}
                    } else {
	                    for (var i in _$local.spot_cache) {
	                        for (var x in _$local.spot_cache[i]) {
	                            if (x != $(this).attr('id')) {
	                                continue;
	                            }
	                            var graph_objects = _$local.spot_cache_obj[i][x];
	                            var spot_id = x;                            
	                            var start = $(this).attr('data-last-point');
	                            var end = parseInt($(this).attr('data-last-point')) + 72;
	                            var max = parseInt($(this).attr('data-max-point'));
	                            
	                            console.log(start, end);
	                            
	                            // we dont want to contine past max
	                            if (start >= max) {
		                            return true;
	                            }
	                            $(this).data_loader.buildslide(_$local.spot_cache[i][x], $(this).attr('id'), start, end, graph_objects.timeline, graph_objects.winds);
	                        }
	                    }
                    }
                }
            });
        });
    }

    $.fn.data_loader.reset = function() {
	    _$local.spot_cache = [];
		_$local.spot_cache_obj = [];
    }
    
    $.fn.data_loader.reload = function(spot_id) {
	    return this.each(function(){
			if (_$local.spot_cache === undefined) {
				_$local.spot_cache = [];
			}
			if (_$local.spot_cache_obj === undefined) {
				_$local.spot_cache_obj = [];
			}
    		$("#" + spot_id + ".scroll-pane").data_loader();	    		
	    });
    }

    $.fn.data_loader.settings = {
        'per_slide': 5,
        'start': 0,
        'width': 100,
        'sensitivity': 10,
        'cache': []
    };
    
    $.fn.data_loader.build_cache_tables = function(spot_id) {
	    if (typeof _$local.spot_cache_obj === 'undefined') {
		    _$local.spot_cache_obj = [];
	    }
	    if (typeof _$local.spot_cache === 'undefined') {
		    _$local.spot_cache = [];
	    }
	    
	    for(var x in _$local.spot_cache_obj) {
	    	for (var z in _$local.spot_cache_obj[x]) {
	    		if (spot_id != z) {
		    		continue;
	    		}
	    		_$local.spot_cache_obj.splice(x, 1);
	    	}
	    }

	    for(var x in _$local.spot_cache) {
	    	for (var z in _$local.spot_cache[x]) {
	    		if (spot_id != z) {
		    		continue;
	    		}
	    		_$local.spot_cache.splice(x, 1);
	    	}
	    }
    }
    
    $.fn.data_loader.parse_set = function(data, sub_set) {
	    for (var i in data) {
	    	var counter = 0;
	    	for (var z=0; z < data[i].length; z++) {
		    	if (counter < sub_set) {
		    		data[i].splice(z, 1);
		    		counter = 0;
		    	}
		    	counter++;
	    	}
	    }
	    return data;
    };

    $.fn.data_loader.buildslide = function(data, spot_id, start_spot, max_spots, graph_object, wind_object) {

		var y = [], z=[], x=[], i=0, pixel_width_length=25, max_size=20, initial=false, absolute_max_spots=384, counter=0, min_size=1, sub_set = 4,
		top_padding=0, padding=4, gutter=20, position=0, radius=20, left_side=0, top_side=0, auto_load = false, window_width = $(window).width();

		if (typeof jQuery("#" + spot_id)[0] === 'undefined') {
			return false;
		}

		// clears out the cache for this spot_id
		this.build_cache_tables(spot_id);

		var cache_obj = {};
		cache_obj[spot_id] = data;
		_$local.spot_cache.push(cache_obj);

		if (!start_spot) {
			start_spot = 0;
		}
		if (!max_spots) {
			max_spots = 108;
		}

		var max_spots = 384;

		var data = this.parse_set(data, sub_set);

		x = data[0]; y = data[1]; z = data[2]; za = data[3]; xa = data[4];
		var picture_width = ((pixel_width_length * parseInt(max_spots)) / sub_set) + 10;

		if (graph_object === undefined) {
			var b = Raphael(spot_id, picture_width, 120);
			initial = true;
		} else {
			var b = graph_object;
			$(b.canvas).width(picture_width);
		}

		if (wind_object === undefined) {
    		var r = Raphael(spot_id, picture_width, 145);
		} else {
			var r = wind_object;
			$(r.canvas).width(picture_width);
		}

		var spot_cache_obj = {};
		spot_cache_obj[spot_id] = {};
		spot_cache_obj[spot_id]['timeline'] = b;
		spot_cache_obj[spot_id]['winds'] = r;
		_$local.spot_cache_obj.push(spot_cache_obj);

    	var height = 120, sleft = 0, stop = 0, width = 0, left_position = 0, padding = 2, top_padding = 20, x_width = 25, x_padding = 2, 
    	height = 60, start_position, circle, bar_height, starting_point = 100, bottom_padding = 12, counter = 0;
    	
    	start_position = x_width - 10;
    	
    	if (max_spots > absolute_max_spots) {
	    	var max_spots = absolute_max_spots;
    	}

		for (var zx = start_spot; zx < max_spots; zx++) {
			if (max_spots !== "all" && counter >= max_spots) {
    			continue;
			}

    		if (max_spots !== absolute_max_spots && (counter + max_spots) >= absolute_max_spots) {
    			console.log('skip');
	    		continue;
    		}

			i = counter;
    		obj_val = y[i];
    		
    		if (typeof obj_val === 'undefined') {
	    		continue;
    		}
    		
    		bar_height = (parseInt(obj_val) * 4);
    		left_position = (x_width * zx) + start_position;
			width = obj_val + (2 * parseInt(x_padding));
    		sleft = left_position;
    		stop = starting_point - ((parseInt(height) / 2) + (width / 2) + top_padding);
    		circle = r.rect(sleft, (starting_point - bar_height), x_width, bar_height);

    		if (obj_val >= 0 && obj_val <= 3) {
    			wind_color = "#99FFCC";
    		}
    		if (obj_val >= 3 && obj_val <= 4) {
    			wind_color = "#99FF00";
    		}
    		if (obj_val >= 5 && obj_val <= 7) {
    			wind_color = "#99CC00";
    		}
    		if (obj_val > 7 && obj_val <= 8) {
    			wind_color = "#FFFF00";
    		}
    		if (obj_val >= 9 && obj_val <= 12) {
    			wind_color = "#FFCC00";
    		}
    		if (obj_val >= 13 && obj_val <= 14) {
    			wind_color = "#FF3300";
    		}
    		if (obj_val >= 15) {
    			wind_color = "#000000";
    		}

	    	circle.attr("fill", wind_color);
			circle.attr("stroke", "none");
			
			var wind_text = "";
			if (typeof za[i].english !== 'undefined') {
				wind_text = za[i].english + " MPG";
			}
			
			circle.data({
				"value": wind_text,
				"x": sleft,
				"y": stop,
				"r": obj_val,
				"w": x_width
			});

			// Bottom Arrow Winds
			var icon = b.getIcon("arrow-wind", {fill: wind_color});
			if (typeof z[i] !== 'undefined') {
				var text_direction = false;
				if (typeof z[i].degrees !== 'undefined') {
					var degree = parseInt(z[i].degrees) + 180;
					icon.transform("t" + left_position + ",0r" + degree + "t0,0s.8");
					if (typeof z[i].dir !== 'undefined') {
						var text_direction = b.text(left_position + (x_width / 2), 45, z[i].dir);						
					}
				}
				if (text_direction) {
					text_direction.transform("r-90");					
				}
			}

    		// Text (time)
    		if (typeof x[i] != 'undefined') {
	    		var txt_header = r.text(sleft+(x_width/2), 35, x[i]);
	    		txt_header.attr({'font':'10px Fontin-Sans, Arial', fill: '#000', stroker: 'none'});
	    		txt_header.rotate(-90, sleft+(x_width/2), 35);
    		}

			// Handle the bar splits and date infos    		
    		if (xa[i] !== 'undefined') {
    			// Sort out our Dates
    			if (typeof xa[i].timestamp !== 'undefined') {
    				xa[i].datestamp = xa[i].datestamp.replace(/\-/g, '/');
    				var date_timestamp = xa[i].datestamp + " " + xa[i].timestamp;
    				xa[i].date_timestamp = date_timestamp;
    				xa[i].parsed = Date.parse(date_timestamp);
    				var date_time = new Date(xa[i].parsed);
    				xa[i].hour = date_time.getHours();
    			}
    			// Date for the Day & Bar Sep. Days
	    		if ((xa[i].ampm == "AM" && xa[i].hour == "0" || xa[i].ampm == "AM" && xa[i].hour == "1") || (xa[i].ampm == "PM" && xa[i].hour == "1" || xa[i].ampm == "PM" && xa[i].hour == "0")) {
		    		var bar = r.rect((sleft-2), 0, 4, stop);
		    		bar.attr({fill: '#000'});
		    		var date_text_source = "", date_text = "";

		    		if (typeof moment == 'function') {
			    		date_text_source = moment(date_time).format("dddd MMMM Do");
		    		} else {
			    		date_text_source = date_time;
		    		}
		    		var date_text = r.text(sleft+(x_width/2) + 100, 4, date_text_source);
	    		}
	    		// Grey-out unavailable hours
	    		if (xa[i].ampm == "AM" && parseInt(xa[i].hour) < 6 || xa[i].ampm == "PM" && parseInt(xa[i].hour) > 19) {
		    		var bar = r.rect(sleft, 0, x_width, starting_point);
		    		bar.attr({fill: '#A4A4A4', stroke: 'none', 'opacity': .5});
	    		}
    		}
    		
    		if (typeof xa[i].icon_url !== 'undefined') {
	    		var icon = r.image(xa[i].icon_url, (sleft + (x_width / 2)) - 10, 120, 25, 25);	    		
    		}

    		var txt = r.text(sleft+(x_width/2), (starting_point + bottom_padding), obj_val);
    		txt.attr({'font':'12px Fontin-Sans, Arial', fill: '#000', stroker: 'none'});

    		// Wind Speeds (MPH) overlayed on Graph
    		if (typeof za[i] !== 'undefined') {
    			var wind_text = false;

    			if (typeof za[i].english !== 'undefined') {
    				var wind_text = (typeof za[i].english !== 'undefined') ? za[i].english + " MPH" : "";
    			}
    			
    			if (wind_text) {
		    		var wind_speed = r.text(left_position + (x_width / 2), (starting_point - 20), wind_text);
		    		wind_speed.attr({'font':'10px Fontin-Sans, Arial', fill: '#000', stroker: 'none'});
					wind_speed.transform("r-90");	    			
    			}
    		}

    		position += width;
	    	counter++;	
		}
		
		generating = false;
		
		var obj = $("#" + spot_id);
		
		$("#" + spot_id + "-loader").remove();
		obj.addClass("scroll-pane ui-widget ui-widget-header ui-corner-all").removeClass("hidden").attr('data-last-point', max_spots);

		if (initial) {
			obj.attr('data-max-point', absolute_max_spots);
		}

		obj.attr('data-generating', false);

		$("#" + spot_id + ".scroll-pane").data_loader();
    }

    $.fn.data_loader.buildslide.settings = {
	    'absolute_max_spots': 384,
	    'picture_width': 120,
    };
    
})(jQuery);
