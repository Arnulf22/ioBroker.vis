jQuery.extend(true, dui.binds, {
	bars: {
		position : {
			floatHorizontal: 0,
			floatVertical:   1,
			dockTop:         2,
			dockBottom:      3,
			dockLeft:        4,
			dockRight:       5
		},
		bType : {
			filters:    0,
			navigation: 1
		},
        width: 240, // width of edit fields
		created: [],
		themes: [{css_class: 'sidebar-dark', name: 'Dark glass'},
				 {css_class: 'sidebar-blue', name: 'Blue glass'},
				 {css_class: 'sidebar-red',  name: 'Red glass'}
				 ],
        // Return widget for hqWidgets Button
        getWidgetByObj: function (div) {
            var duiWidget = dui.views[dui.activeView].widgets[div.barsIntern.wid];
            if (duiWidget === undefined) {
                for (var view in dui.views) {
                    if (dui.views[view].widgets[div.barsIntern.wid]) {
                        duiWidget = dui.views[view].widgets[div.barsIntern.wid];
                        break;
                    }
                }
            }
            
            return duiWidget;
        },
        // Save settings of this widgets
        editSave: function (div) {
            if (div !== undefined) {
                // Save settings of one widget
                var newOpt = JSON.stringify (div.barsOptions);
                var duiWidget = dui.binds.bars.getWidgetByObj (div);
                
                if (duiWidget) {
                    duiWidget.data['baroptions'] = newOpt;
                    $(div).attr ('baroptions', newOpt);
                    console.log ("Stored: " + newOpt);
                }
                else
                    console.log ("Cannot find " + duiWidget.advSettings.elemName + " in any view");
            }
            
            if (dui.binds.bars.editSaveTimer != null) {
                clearTimeout(dui.binds.bars.editSaveTimer);
            }
                
            dui.binds.bars.editSaveTimer = setTimeout (function () { 
                dui.saveRemote (); 
                console.log ("Saved!"); 
                dui.binds.bars.editSaveTimer = null;
            }, 2000);
        },
        _editSliderHandler: function (attr_name, div, min, max) {
            var elem = document.getElementById ('inspect_' + attr_name);
            if (elem != null) {
                elem.ctrlAttr = attr_name;
                elem.parent   = div;
                var parent = $('#inspect_' + attr_name);
                parent.html ("<table style='no-spaces'><tr style='no-spaces'><td style='no-spaces'><input type='text' size='3' value='"+div.barsOptions[attr_name]+"' id='inspect_" + attr_name+ "_text'></td><td style='no-spaces'><div style='width: "+(dui.binds.bars.width - 40)+"px' id='inspect_" + attr_name+ "_slider'></div></td></tr></table>");

                var slider = document.getElementById ("inspect_" + attr_name+ "_slider");
                var text   = document.getElementById ("inspect_" + attr_name+ "_text");
                slider.jText     = text;
                slider.ctrl      = div;
                slider.attr_name = attr_name;
                text.slider      = slider;
                text.ctrl        = div;
                text.attr_name   = attr_name;
                
                var slider = $("#inspect_" + attr_name+ "_slider").slider({
                    min: min,
                    max: max,
                    range: "min",
                    value: div.barsOptions[attr_name],
                    slide: function( event, ui ) {
                        var div = this.ctrl;
                        var attr_name = this.attr_name;
                        $(this.jText).val(ui.value);
                        if (div.barsOptions[attr_name] != ui.value) {
                            div.barsOptions[attr_name] = ui.value;
                            if (!isNaN(div.barsOptions[attr_name])) {
                                dui.binds.bars.init (div.barsIntern.wid);
                                dui.binds.bars.editSave(div);
                            }
                        }
                    }
                });
                $( "#inspect_" + attr_name+ "_text" ).change(function() {
                  this.slider.slider( "value", $(this).val() );
                });                
            }	        
        },
		_editSelectHandler: function (attr_name, div, _onPreChange, _onPostChange) {
            var elem;
            if ((elem = document.getElementById ('inspect_'+attr_name)) != null) {
                // Set actual value
                for (var i = 0; i < elem.options.length; i++)
                    if (elem.options[i].value == div.barsOptions[attr_name]) {
                        elem.options[i].selected = true;
                        break;
                    }
                
                elem.parent   = div;
                elem.ctrlAttr = attr_name;
				elem._onPreChange = _onPreChange;
				elem._onPostChange = _onPostChange;
                $(elem).change (function () { 
                    var div = this.parent;
                    div.barsOptions[this.ctrlAttr] = $(this).prop('value');
					if (this._onPreChange)
						this._onPreChange (div, this.ctrlAttr, div.barsOptions[this.ctrlAttr]);
                    dui.binds.bars.init (div.barsIntern.wid);
                    dui.binds.bars.editSave(div);
					if (this._onPostChange)
						this._onPostChange (div, this.ctrlAttr, div.barsOptions[this.ctrlAttr]);
                });
            }        
        },       	
        _editTextHandler: function (attr_name, div, i) {
            var elem;
            if (((elem = document.getElementById ('inspect_' + attr_name + "" + i)) != null) ||
                ((elem = document.getElementById ('inspect_' + attr_name)) != null)){
                elem.parent   = div;
                elem.ctrlAttr = attr_name;
                elem.ctrlId   = i;
                var jeee = $(elem).change (function () {
                    // If really changed
                    var div = this.parent;
                    if (this.ctrlId != -1) {
                        div.barsOptions.buttons[this.ctrlId][this.ctrlAttr] = $(this).prop('value');
                        dui.binds.bars.init (div.barsIntern.wid);
                    }
                    else{
                        div.barsOptions[this.ctrlAttr] = $(this).prop('value');
                        dui.binds.bars.init (div.barsIntern.wid);
                    }
                    dui.binds.bars.editSave(div);
                });

                jeee.keyup (function () {
                    if (this.parent.timer) 
                        clearTimeout (this.parent.timer);
                        
                    this.parent.timer = setTimeout (function(elem_) {
                        $(elem_).trigger('change');
                        elem_.parent.timer=null;
                    }, 200, this);
                });            

                var btn = document.getElementById ('inspect_' + attr_name + "" + i + 'Btn');
                if (btn) {
                    btn.parent   = div;
                    btn.ctrlAttr = attr_name;
                    btn.ctrlId   = i;
                    $(btn).bind("click", {msg: div}, function (event) {
                        var div = event.data.msg;
                        var _settings = {
                            current:     div.barsOptions.buttons[this.ctrlId][this.ctrlAttr],
                            onselectArg: this.ctrlAttr + "" + i,
                            filter:      ".png;.gif;.jpg;.bmp",
                            onselect:    function (img, ctrlAttr) {
                                $('#inspect_'+ctrlAttr).val(imageSelect.GetFileName(img, "img/")).trigger("change");
                            }};
                        imageSelect.Show (_settings);                    
                    });
                }
            }	
        },
		_editTextAutoCompleteHandler: function (attr_name, div, _sourceFnc) {
				// auto complete for class key
				var elem = document.getElementById ('inspect_' + attr_name);
				if (elem) {
					elem.ctrlAttr = attr_name;
					elem.ctrl = div;

					elem._save = function () {
						if (this.timer) 
							clearTimeout (this.timer);
							
						this.timer = setTimeout (function(elem_) {
							var div = elem_.ctrl;
							 // If really changed
							div._oldAttr = div.barsOptions[elem_.ctrlAttr];
							div.barsOptions[elem_.ctrlAttr] = $(elem_).prop('value');
							dui.binds.bars.init (div.barsIntern.wid);
							dui.binds.bars.editSave(div);
						}, 200, this);            
					};
					
					$(elem).autocomplete({
						minLength: 0,
						source: _sourceFnc,
						select: function (event, ui){
							this._save();               
						},
						change: function (event, ui) {
							this._save();               
						}
					}).focus(function () {
						$(this).autocomplete("search", "");
					}).keyup (function () {
						this._save();               
					}); 
				}			
		},
        _editCheckboxHandler: function (attr_name, div) {
            var elem;
            if ((elem = document.getElementById ('inspect_'+attr_name)) != null) {
                elem.ctrl     = div;
                elem.ctrlAttr = attr_name;
                
                $(elem).change (function () { 
                    var div = this.ctrl;
					div.barsOptions[this.ctrlAttr] = $(this).prop('checked');
					dui.binds.bars.init (div.barsIntern.wid);
                    dui.binds.bars.editSave(div);
                });
            }        
        },
		drawButton: function (wid, i, opt) {
            var style="style='"+(opt.bWidth ? ("width:"+opt.bWidth+"px;") : "")+(opt.bHeight ? ("height:"+opt.bHeight+"px;") : "");
			var text = "<div id='"+wid+"_btn"+i+"' "+style+"' class='ui-state-default ui-button ui-widget'>\n";
			var isTable = true || (opt.buttons[i].image && opt.buttons[i].text);
			if (isTable) {
				text += "<table "+style+" class='no-spaces'><tr style='width:100%;height:100%' class='no-spaces'>\n";
				text += "<td class='no-spaces' style='width:"+opt.bOffset+"%; text-align: "+opt.bImageAlign+"'>\n";
			}
			if (opt.buttons[i].image) {
				text += "<img class='no-spaces' src='"+((opt.buttons[i].image.indexOf ("/") != -1) ? opt.buttons[i].image : "img/" + opt.buttons[i].image) +"'/>\n";
			}
			if (isTable) {
				text += "</td><td class='no-spaces' style='width:"+(100 - opt.bOffset)+"%; text-align: "+opt.bTextAlign+"'>\n";
			}
			if (opt.buttons[i].text) {
				text += "<span style='text-align: "+opt.bTextAlign+"'>" + opt.buttons[i].text + "</span>\n";
			}
			if (isTable) {
				text += "</td></tr></table>\n";
			}
			text += "</div>\n";
			return text;
		},
		draw: function(div, jDiv) {			
            var isHorizontal = (div.barsOptions.position == dui.binds.bars.position.floatHorizontal ||
			    div.barsOptions.position == dui.binds.bars.position.dockTop ||
			    div.barsOptions.position == dui.binds.bars.position.dockBottom);
           
            var w,h,text="";
            if (isHorizontal) {
                w = div.barsOptions.bWidth * div.barsOptions.buttons.length + div.barsOptions.bSpace * (div.barsOptions.buttons.length - 1);
                h = div.barsOptions.bHeight;
            }
            else  {
                h = div.barsOptions.bHeight * div.barsOptions.buttons.length + div.barsOptions.bSpace * (div.barsOptions.buttons.length - 1);
                w = div.barsOptions.bWidth;
            }
				
			text += "<table style='width:"+w+"px; height:"+h+"px' class='no-spaces'>";
			if (isHorizontal) {
				text += "<tr class='no-spaces' style='height:"+div.barsOptions.bHeight+"px'>";
				for (var i = 0; i < div.barsOptions.buttons.length; i++) {
					text += "<td class='no-spaces' style='height:"+div.barsOptions.bHeight+"px;width:"+div.barsOptions.bWidth+"px'>" + this.drawButton (div.barsIntern.wid, i, div.barsOptions) + "</td>";
                    if (i != div.barsOptions.buttons.length - 1)
                        text += "<td class='no-spaces' style='width:"+div.barsOptions.bSpace+"px'></td>";
				}
				text += "</tr>";
			}
			else {
				for (var i = 0; i < div.barsOptions.buttons.length; i++) {
					text += "<tr class='no-spaces'  style='height:"+div.barsOptions.bHeight+"px;width:"+div.barsOptions.bWidth+"px'><td class='no-spaces' style='height:"+div.barsOptions.bHeight+"px;width:"+div.barsOptions.bWidth+"px'>" + this.drawButton (div.barsIntern.wid, i, div.barsOptions) + "</td></tr>";
                    if (i != div.barsOptions.buttons.length - 1)
                        text += "<tr class='no-spaces'><td class='no-spaces' style='height:"+div.barsOptions.bSpace+"px'></td></tr>";
				}
			}
			text += "</table>";

			jDiv.html (text);
            jDiv.css ({width: w, height: h});
			var elem = document.getElementById (div.barsIntern.wid+"_button");
			if (elem) {
				elem.ctrlId = div.barsIntern.wid;
				$('#'+div.barsIntern.wid+"_button").button ({
				  icons: {
					primary: "ui-icon-carat-1-n"
				  },
				  text: false
				}).click (function () {
					var j = $("#"+this.ctrlId+"_content");
					if (j.css ('display') == 'none') {
						$('#'+this.ctrlId+"_button").button ('option', {icons: {primary: "ui-icon-carat-1-s"}});
					}
					else
						$('#'+this.ctrlId+"_button").button ('option', {icons: {primary: "ui-icon-carat-1-n"}});
					$("#"+this.ctrlId+"_content").slideToggle("slow");
				});
			}
		
            var hMax = 0;
            var wMax = 0;
			for (var i = 0; i < div.barsOptions.buttons.length; i++) {
                var btn = $('#'+div.barsIntern.wid+"_btn"+i);
				//btn.button();
                if (hMax < btn.height()) hMax = btn.height ();
                if (wMax < btn.width())  wMax = btn.width ();
			}
            if (wMax != 0 && hMax != 0) {
                for (var i = 0; i < div.barsOptions.buttons.length; i++) {
                    var html_btn = document.getElementById (div.barsIntern.wid+"_btn"+i);
                    html_btn.ctrl = div;
                    html_btn.ctrlId = i;
                    var btn = $(html_btn);
                    btn.width(wMax);
                    btn.height(hMax);
                    btn.css ({'border-radius': div.barsOptions.bRadius});
                    btn.hover (function () { $(this).addClass ('ui-state-hover');},function () { $(this).removeClass ('ui-state-hover');});
                    btn.click (function () { if (this.ctrl._onClick) this.ctrl._onClick (this, this.ctrl, this.ctrlId) });
                }
            }
			
			jDiv.css ({'border-radius': 0, padding: 0});
			
			// Remove previous class
			if (div._oldAttr)
				jDiv.removeClass(div._oldAttr);
			
			if (div.barsOptions.position == dui.binds.bars.position.floatHorizontal ||
			    div.barsOptions.position == dui.binds.bars.position.floatVertical) {
				jDiv.css ({'position':'absolute'});

				for (var i = 0; i < dui.binds.bars.themes.length; i++) {
					jDiv.removeClass(dui.binds.bars.themes[i].css_class);
				}
				if (div.barsOptions.bTheme != "") {
					jDiv.addClass(div.barsOptions.bTheme);
					jDiv.css ({'border-radius': 10, padding: 15});
				}
				else {
				}
			}
			else {
				jDiv.css ({left: 'auto', top: 'auto'});
				var position = "bottom";
				if (div.barsOptions.position == dui.binds.bars.position.dockTop) position = "top";
				else
				if (div.barsOptions.position == dui.binds.bars.position.dockLeft) position = "left";
				else
				if (div.barsOptions.position == dui.binds.bars.position.dockRight) position = "right";
				
				div.sidebar = jDiv.sidebar({position: position, width: jDiv.width() + 20, height: jDiv.height() + 20, open:"click", id: div.barsIntern.wid, root: $('#duiview_' + div.barsIntern.view)});
				$('#jquerySideBar_'+div.barsIntern.wid).addClass(div.barsOptions.bTheme);
			}
		},
		editButton: function (div, i, isInit) {
            var sText = "";
            if (!isInit) {
                sText += "<tr><td colspan=2 class='bars_line'></td></tr>";
                // Image
                sText += "<tr><td>"+ dui.translate("Icon:")+"</td><td>";
                sText += "<input id='inspect_image"+i+"' style='width: "+(dui.binds.bars.width - 30)+"px' type='text' value='"+(div.barsOptions.buttons[i].image || "")+"'>";
                sText += "<input id='inspect_image"+i+"Btn' style='width: 30px' type='button' value='...'>";
                sText += "</td></tr>";
                    
                // Name
                sText += "<tr><td>"+ dui.translate("Caption:") +"</td><td><input style='width: "+dui.binds.bars.width+"px' id='inspect_text"+i+"' type='text' value='"+(div.barsOptions.buttons[i].text || "")+"'></td></tr>";
                
                // option
                if (div.barsIntern.wType == 'tplBarFilter') {
                    sText += "<tr><td>"+ dui.translate("Filter key:") +"</td><td><input style='width: "+dui.binds.bars.width+"px' id='inspect_option"+i+"' value='"+(div.barsOptions.buttons[i].option || "")+"'></td></tr>";
                }
                else{
                    sText += "<tr><td>"+ dui.translate("Option:") +"</td><td><input style='width: "+dui.binds.bars.width+"px' id='inspect_option"+i+"' type='text' value='"+(div.barsOptions.buttons[i].option || "")+"'></td></tr>";
                }
                
                if (div.barsOptions.buttons.length > 1) {
                    sText += "<tr><td></td><td>";
                    if (i > 0) {
                        sText +="<input type='button' id='barsDel"+i+"' value='"+dui.translate('Delete')+"'>";
                        sText +="<input type='button' id='barsUp" +i+"' value='"+dui.translate('Up')+"'>";
                    }
                    if (i != div.barsOptions.buttons.length - 1) {
                        sText +="<input type='button' id='barsDown" +i+"' value='"+dui.translate('Down')+"'>";
                    }
                    
                    sText += "</td></tr>";
                }
                
            }
            else {
                dui.binds.bars._editTextHandler ("image",  div, i);
                dui.binds.bars._editTextHandler ("text",   div, i);
                if (div.barsIntern.wType == 'tplBarFilter') {
                    var elem = document.getElementById ('inspect_option'+i);
                    if (elem) {
                        elem.parent   = div;
                        elem.ctrlAttr = 'option';
                        elem.ctrlId   = i;
                  
                        $(elem).autocomplete({
                            minLength: 0,
                            source: function(request, response) {            
                                var data = $.grep(dui.views[dui.activeView].filterList, function(value) {
                                    return value.substring(0, request.term.length).toLowerCase() == request.term.toLowerCase();
                                });            

                                response(data);
                            },
                            select: function (event, ui){
                                // If really changed
                                var div = this.parent;
                                div.barsOptions.buttons[this.ctrlId][this.ctrlAttr] = ui.item.value;
                                dui.binds.bars.init (div.barsIntern.wid);
                                dui.binds.bars.editSave(div);
                            },
                            change: function (event, ui) {
                                // If really changed
                                var div = this.parent;
                                div.barsOptions.buttons[this.ctrlId][this.ctrlAttr] = $(this).prop('value');
                                dui.binds.bars.init (div.barsIntern.wid);
                                dui.binds.bars.editSave(div);
                            }
                        }).focus(function () {
                            $(this).autocomplete("search", "");
                        }).keyup (function () {
                            if (this.parent.timer) 
                                clearTimeout (this.parent.timer);
                                
                            this.parent.timer = setTimeout (function(elem_) {
                                 // If really changed
                                var div = elem_.parent;
                                div.barsOptions.buttons[elem_.ctrlId][elem_.ctrlAttr] = $(elem_).prop('value');
                                dui.binds.bars.init (div.barsIntern.wid);
                                dui.binds.bars.editSave(div);
                                elem_.parent.timer=null;
                            }, 200, this);
                        });   
                    }
                }
                else {
                    dui.binds.bars._editTextHandler ("option", div, i);
                }
                
                // Use delete button
                var btn = $('#barsDel'+i);
                if (btn) {
                    btn.button();
                    var htmlbtn = document.getElementById ('barsDel'+i);
                    if (htmlbtn) {
                        htmlbtn.parent = div;
                        htmlbtn.ctrlId = i;
                    }
                    btn.click (function () {
                        var div = this.parent;
                        for (var i = this.ctrlId; i < div.barsOptions.buttons.length - 1; i++){
                            div.barsOptions.buttons[i] = div.barsOptions.buttons[i + 1];
                        }
                        div.barsOptions.buttons.length = div.barsOptions.buttons.length - 1;
                        dui.binds.bars.init (div.barsIntern.wid);
                        dui.binds.bars.edit (div.barsIntern.wid, div.barsIntern.editParent);
                        dui.binds.bars.editSave(div);
						dui.inspectWidget (div.barsIntern.wid);
                    });
                }
                btn = $('#barsUp'+i);
                if (btn) {
                    btn.button( {icons: {primary: "ui-icon-carat-1-s"}});
                    var htmlbtn = document.getElementById ('barsUp'+i);
                    if (htmlbtn) {
                        htmlbtn.parent = div;
                        htmlbtn.ctrlId = i;
                    }
                    btn.click (function () {
                        var div = this.parent;
                        var temp = div.barsOptions.buttons[i - 1];
                        div.barsOptions.buttons[i - 1] = div.barsOptions.buttons[i];
                        div.barsOptions.buttons[i] = temp;
                        dui.binds.bars.init (div.barsIntern.wid);
                        dui.binds.bars.edit (div.barsIntern.wid, div.barsIntern.editParent);
                        dui.binds.bars.editSave(div);
                    });                    
                }
                btn = $('#barsDown'+i);
                if (btn) {
                    btn.button({icons: {primary: "ui-icon-carat-1-n"}});
                    var htmlbtn = document.getElementById ('barsDown'+i);
                    if (htmlbtn) {
                        htmlbtn.parent = div;
                        htmlbtn.ctrlId = i;
                    }
                    btn.click (function () {
                        var div = this.parent;
                        var temp = div.barsOptions.buttons[i + 1];
                        div.barsOptions.buttons[i + 1] = div.barsOptions.buttons[i];
                        div.barsOptions.buttons[i] = temp;
                        dui.binds.bars.init (div.barsIntern.wid);
                        dui.binds.bars.edit (div.barsIntern.wid, div.barsIntern.editParent);
                        dui.binds.bars.editSave(div);
                    });                    
                }            
            }
            return sText;
        },
        edit: function (wid, jParent) {
            var div  = document.getElementById (wid);
            if (div.barsOptions) {
                div.barsIntern.editParent = jParent;
                var sText = "<table id='barsEditElements' style='width:100%'>";
                sText += "<tr><td>"+ dui.translate("Bar type:")+"</td><td><select id='inspect_position' style='width: "+dui.binds.bars.width+"px'>";
                sText += "<option value='0'>" +dui.translate("Horizontal")+"</option>";
                sText += "<option value='1'>" +dui.translate("Vertical")+"</option>";
                sText += "<option value='2'>" +dui.translate("Docked at top")+"</option>";
                sText += "<option value='3'>" +dui.translate("Docked at bottom")+"</option>";
                sText += "<option value='4'>" +dui.translate("Docked at left")+"</option>";
                sText += "<option value='5'>" +dui.translate("Docked at right")+"</option>";
                sText += "</select></td></tr>";           
                
                sText += "<tr><td>"+ dui.translate("Button width:")+"</td><td id='inspect_bWidth' style='no-spaces'></td></tr>";
                sText += "<tr><td>"+ dui.translate("Button height:")+"</td><td id='inspect_bHeight' style='no-spaces'></td></tr>";
                sText += "<tr><td>"+ dui.translate("Button space:")+"</td><td id='inspect_bSpace' style='no-spaces'></td></tr>";
                sText += "<tr><td>"+ dui.translate("Border radius:")+"</td><td id='inspect_bRadius' style='no-spaces'></td></tr>";
                sText += "<tr><td>"+ dui.translate("Text offset %:")+"</td><td id='inspect_bOffset' style='no-spaces'></td></tr>";

                sText += "<tr><td>"+ dui.translate("Image align:")+"</td><td><select id='inspect_bImageAlign' style='width: "+dui.binds.bars.width+"px'>";
                sText += "<option value='center'>" +dui.translate("Center")+"</option>";
                sText += "<option value='left'>"   +dui.translate("Left")+"</option>";
                sText += "<option value='right'>"  +dui.translate("right")+"</option>";
                sText += "</select></td></tr>";           

                sText += "<tr><td>"+ dui.translate("Text align:")+"</td><td><select id='inspect_bTextAlign' style='width: "+dui.binds.bars.width+"px'>";
                sText += "<option value='center'>" +dui.translate("Center")+"</option>";
                sText += "<option value='left'>"   +dui.translate("Left")+"</option>";
                sText += "<option value='right'>"  +dui.translate("right")+"</option>";
                sText += "</select></td></tr>";           

                sText += "<tr><td>"+dui.translate("Theme:")+"</td><td><input type='text' id='inspect_bTheme' value='"+(div.barsOptions.bTheme || "") + "' size='44' /></td></tr>";			
				
				sText += "<tr><td></td><td><input id='inspect_barShow' type='button' value='"+dui.translate("Show")+"'></td></tr>";  					

                // Add effects for filters
                if (div.barsIntern.wType == 'tplBarFilter' ||
				    div.barsIntern.wType == 'tplBarNavigator') {
					dui.updateFilter();
                    sText += "<tr><td>"+ dui.translate("Hide effect:")+"</td><td><select id='inspect_bHideEffect' style='width: "+(dui.binds.bars.width - 40)+"px'>";
					var sEffects = "";
                    sEffects += "<option value=''>Show/Hide</option>";
                    //sEffects += "<option value='show'>Show/Hide</option>";
                    sEffects += "<option value='blind'>Blind</option>";
                    sEffects += "<option value='bounce'>Bounce</option>";
                    sEffects += "<option value='clip'>Clip</option>";
                    sEffects += "<option value='drop'>Drop</option>";
                    sEffects += "<option value='explode'>Explode</option>";
                    sEffects += "<option value='fade'>Fade</option>";
                    sEffects += "<option value='fold'>Fold</option>";
                    sEffects += "<option value='highlight'>Highlight</option>";
                    sEffects += "<option value='puff'>Puff</option>";
                    sEffects += "<option value='pulsate'>Pulsate</option>";
                    sEffects += "<option value='scale'>Scale</option>";
                    sEffects += "<option value='shake'>Shake</option>";
                    sEffects += "<option value='size'>Size</option>";
                    sEffects += "<option value='slide'>Slide</option>";
                    //sEffects += "<option value='transfer'>Transfer</option>";
                    sText += sEffects + "</select><input id='inspect_bHideEffectMs' value='"+div.barsOptions.bShowEffectMs+"' style='width:40px'></td></tr>";  

                    sText += "<tr><td>"+ dui.translate("Show effect:")+"</td><td><select id='inspect_bShowEffect' style='width: "+(dui.binds.bars.width - 40)+"px'>";
                    sText += sEffects + "</select><input id='inspect_bShowEffectMs' value='"+div.barsOptions.bShowEffectMs+"' style='width:40px'></td></tr>";     
                    
					sText += "<tr><td></td><td><input id='inspect_test' type='button' value='"+dui.translate("Test")+"'></td></tr>";  		

					if (div.barsIntern.wType == 'tplBarFilter') {
						sText += "<tr><td>"+ dui.translate("One at time:")+"</td><td><input id='inspect_bOnlyOneSelected' type='checkbox' "+((div.barsOptions.bOnlyOneSelected ) ? "checked" : "")+"></td></tr>";  		
					}
                }
                
                for (var i = 0; i < div.barsOptions.buttons.length; i++) {
                    sText += dui.binds.bars.editButton (div, i);
                }   
                sText += "<tr><td><input type='button' id='barsAdd' value='"+dui.translate("Add")+"'></td></tr></table>";
                $('#barsEditElements').remove ();
                jParent.append (sText);
                			
                for (var i = 0; i < div.barsOptions.buttons.length; i++) {
                    sText += dui.binds.bars.editButton (div, i, true);
                }                   
                dui.binds.bars._editSelectHandler ('position', div, function (div, ctrlAttr, val) {
					if (val > 1) {
						$('#inspect_css_left').val("auto").trigger("change");
						$('#inspect_css_top').val("auto").trigger("change");
					}
				},
				function (div, ctrlAttr, val) {
					dui.inspectWidget (div.barsIntern.wid);
				});
                
                document.getElementById ('barsAdd').parent = div;
                $('#barsAdd').button().click (function () {
                    var div = this.parent;
                    div.barsOptions.buttons[div.barsOptions.buttons.length] = {"image": "", "text": "Caption", "option": ""};
                    dui.binds.bars.init (div.barsIntern.wid);
                    dui.binds.bars.edit (div.barsIntern.wid, div.barsIntern.editParent);
                    dui.binds.bars.editSave(div);
					dui.inspectWidget (div.barsIntern.wid);
                });
                	
				// autocomplete for class key
				dui.binds.bars._editTextAutoCompleteHandler ('bTheme', div, function(request, response) {
					var classes = [];
					for (var i = 0; i < dui.binds.bars.themes.length; i++){
						classes[i] = dui.binds.bars.themes[i].css_class;
					}
				
					var data = $.grep(classes, function(value) {
						return value.substring(0, request.term.length).toLowerCase() == request.term.toLowerCase();
					});            

					response(data);
				});                
                dui.binds.bars._editSliderHandler ("bWidth",  div, 10, 300);
                dui.binds.bars._editSliderHandler ("bHeight", div, 10, 300);
                dui.binds.bars._editSliderHandler ("bSpace",  div, 0,  50);
                dui.binds.bars._editSliderHandler ("bRadius", div, 0,  150);
                dui.binds.bars._editSliderHandler ("bOffset", div, 0,  100);
                dui.binds.bars._editSelectHandler ("bTextAlign",  div);
                dui.binds.bars._editSelectHandler ("bImageAlign", div);
                dui.binds.bars._editCheckboxHandler ("bOnlyOneSelected", div);
                if (div.barsIntern.wType == 'tplBarFilter' ||
				    div.barsIntern.wType == 'tplBarNavigator') {
                    dui.binds.bars._editSelectHandler ("bShowEffect",  div);
                    dui.binds.bars._editSelectHandler ("bHideEffect",  div);
                    dui.binds.bars._editTextHandler ("bShowEffectMs", div, -1);
                    dui.binds.bars._editTextHandler ("bHideEffectMs", div, -1);
					$('#inspect_test').button().click (function () {
						if (div.barsIntern.wType == 'tplBarFilter') {
							// Hide all
							dui.changeFilter ("$", div.barsOptions.bShowEffect, div.barsOptions.bShowEffectMs, div.barsOptions.bHideEffect, div.barsOptions.bHideEffectMs);
							
							// Show all
							setTimeout (function () {
								dui.changeFilter ("", div.barsOptions.bShowEffect, div.barsOptions.bShowEffectMs, div.barsOptions.bHideEffect, div.barsOptions.bHideEffectMs);
							}, 500 + parseInt (div.barsOptions.bShowEffectMs));
						}
						else 
						if (div.barsIntern.wType == 'tplBarNavigator'){
							var v = dui.activeView;
							// find other view
							for (var t in dui.views) {
								if (t != v)
									break;
							}
							
							dui.changeView (t, 
								{effect:div.barsOptions.bHideEffect, duration:div.barsOptions.bHideEffectMs}, 
								{effect:div.barsOptions.bShowEffect, duration:div.barsOptions.bShowEffectMs});

							// Show all
							setTimeout (function () {
								dui.changeView (v, 
									{effect:div.barsOptions.bHideEffect, duration:div.barsOptions.bHideEffectMs}, 
									{effect:div.barsOptions.bShowEffect, duration:div.barsOptions.bShowEffectMs});
								dui.inspectWidget (div.barsIntern.wid);
							}, 500 + parseInt (div.barsOptions.bShowEffectMs));
								
						}
					});
                }
                document.getElementById ('inspect_barShow').parent = div;
				$('#inspect_barShow').button().click (function () {
					if (this.parent.barsOptions.position != dui.binds.bars.position.floatHorizontal &&
						this.parent.barsOptions.position != dui.binds.bars.position.floatVertical) {
						$(this.parent).sidebar("open");
					}
				});
            }
        },	
		editDelete: function (wid) {
			var div = document.getElementById (wid);
			if (div) {
				$('#jquerySideBar_'+div.barsIntern.wid).remove ();
				$('#'+div.barsIntern.wid).remove ();
				dui.binds.bars.created[div.barsIntern.wid] = undefined;
				var createdOld = dui.binds.bars.created;
				dui.binds.bars.created = [];
				for (var i = 0; i < createdOld.length; i++) {
					if (createdOld[i] != wid) {
						dui.binds.bars.created[dui.binds.bars.created.length] = createdOld[i];
					}
				}
			}
		},
		setState: function (div, newFilter) {
			var newFilters = (newFilter !== undefined && newFilter != null && newFilter != "") ? newFilter.split(',') : [];
			for (var i = 0; i < div.barsOptions.buttons.length; i++) {
				var htmlBtn = document.getElementById (div.barsIntern.wid+"_btn"+i);
				var isFound = false;
				for (var z = 0; z < newFilters.length; z++) {
					if (div.barsOptions.buttons[i].option == newFilters[z]) {
						isFound = true;
						break;
					}
				}
				if (isFound) {
					htmlBtn._state = 1;
					$(htmlBtn).addClass ('ui-state-active');
				}
				else {
					htmlBtn._state = 0;
					$(htmlBtn).removeClass ('ui-state-active');
				}
			}
		},
		filterChanged: function (view, newFilter) {
			for (var i = 0; i < dui.binds.bars.created.length; i++) {
				var div = document.getElementById (dui.binds.bars.created[i]);
				if (div && div.barsIntern && div.barsIntern.view == view && div.barsIntern.wType == 'tplBarFilter') {
					dui.binds.bars.setState (div, newFilter);
				}
			}
		},
		init: function(wid, options, view, wType, style) {
			var settings = {
				position: 0,
                bWidth:   100,  // Width of the button. 0 - every button has own width
                bHeight:  50,   // Height of the button. 0 - every button has own height
                bSpace:   5,    // Between buttons
                bRadius:  5,    // Button radius
                bOffset:  0,    // 0% Image, 70% Text
                bTextAlign:  'center',
                bImageAlign: 'right',
                bValue:   '',   // start value
                bShowEffect: 'show',
                bHideEffect: 'hide',
                bShowEffectMs: 100,
                bHideEffectMs: 100,
				buttons:  [],
				bOnlyOneSelected: false, // If only one element can be selected
				bTheme:   "sidebar-dark"
			};			
							
			if (document.getElementById (wid) == null) {
				$('#duiview_' + view).append ("<div id='"+wid+"'></div>");
			}
			var div = document.getElementById (wid);
			var barsIntern = null;
			
			if (div.barsIntern) {
				barsIntern = div.barsIntern;
				barsOptions = div.barsOptions;
			}
			
			if (document.getElementById ('jquerySideBar_'+wid)) {
				$('#jquerySideBar_'+div.barsIntern.wid).remove ();
				
				if (document.getElementById (wid) == null) {
					$('#duiview_' + barsIntern.view).append ("<div id='"+wid+"'></div>");
				}
				div = document.getElementById (wid);
				div.barsOptions = barsOptions;
				div.barsIntern  = barsIntern;
			}				
			
			var jDiv = $(div);
            
            if (div.barsOptions === undefined)
                div.barsOptions = {};
                
			var isFound = false;
			for (var i = 0; i < dui.binds.bars.created.length; i++) {
				if (dui.binds.bars.created[i] == wid) {
					isFound = true;
					break;
				}
			}
			if (!isFound) {
				dui.binds.bars.created[dui.binds.bars.created.length] = wid;
			}
				
				
            if (wType !== undefined) {
                if (options !== undefined) {
                    div.barsOptions = $.parseJSON(options);
                }
                div.barsOptions = $.extend(settings, div.barsOptions, true);
                div.barsIntern = {
                    wid:   wid,
                    wType: wType,
                    view:  view,
                    editParent: null
                };
				if (dui.urlParams["edit"] === "") {
					if (div.barsOptions.buttons.length == 0) {
						if (div.barsIntern.wType == 'tplBarFilter') {
							var filter = dui.updateFilter();
							if (filter.length > 0) {
								div.barsOptions.buttons[0] = {'image': "", "text" : dui.translate("All"), "option": ""};
								for (var i = 0; i < filter.length; i++) {	
									div.barsOptions.buttons[i + 1] = {'image': "", "text" : filter[i].charAt(0).toUpperCase() + filter[i].slice(1).toLowerCase(), "option": filter[i]};
								}
							}
							else
								div.barsOptions.buttons[0] = {'image': "", "text" : "Caption", "option": ""};
						}
						else
						if (div.barsIntern.wType == 'tplBarNavigator') {
							for (var v in dui.views) {
								div.barsOptions.buttons[div.barsOptions.buttons.length] = {'image': "", "text" : v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(), "option": v};
							}
						}
					}
				}
            }
            var obj = dui.binds.bars.getWidgetByObj (div);
			
			this.draw(div, jDiv);
		
			// non edit mode
			if (dui.urlParams["edit"] !== "") {
                // Select by default buttons
                if (div.barsIntern.wType == 'tplBarFilter') {
                    if (div.barsOptions.bValue != "") {
                        var values = div.barsOptions.bValue.split(",");
                        for (var i = 0; i < div.barsOptions.buttons.length; i++) {
                            var isFound = false;
                            for(var j = 0; j < values.length; i++) {
                                if(values[i] === div.barsOptions.buttons[i].option) {
                                    isFound = true;
                                    break;
                                }
                            }
                            if (isFound) {
								var htmlBtn = document.getElementById (div.barsIntern.wid+"_btn"+i);
								if (htmlBtn) {
									htmlBtn.state = 1;
									$(htmlBtn).addClass ('ui-state-active');
								}
                            }
                        }
                    }
                }
				else
				if (div.barsIntern.wType == 'tplBarNavigator') {
					var v = dui.activeView;
					if (!v) v =  div.barsIntern.view;
				    for (var i = 0; i < div.barsOptions.buttons.length; i++) {
						if(v === div.barsOptions.buttons[i].option) {
							var htmlBtn = document.getElementById (div.barsIntern.wid+"_btn"+i);
							if (htmlBtn) {
								htmlBtn.state = 1;
								$(htmlBtn).addClass ('ui-state-active');
							}
							break;
						}
					}
				}
            
                // Install on click function 
                if (div._onClick === undefined) {
                    div._onClick = function (htmlBtn, div, i) {
						if (div.barsIntern.wType == 'tplBarNavigator') {
							dui.changeView (div.barsOptions.buttons[i].option, 
								{effect:div.barsOptions.bHideEffect, duration:div.barsOptions.bHideEffectMs}, 
								{effect:div.barsOptions.bShowEffect, duration:div.barsOptions.bShowEffectMs});
						}
						else
						{
							// Save actual state
							var actState = (htmlBtn._state === 1) ? 1 : 0;
							
							if (div.barsOptions.bOnlyOneSelected){
								for (var i = 0; i < div.barsOptions.buttons.length; i++) {
									var btn = document.getElementById (div.barsIntern.wid+"_btn"+i);
									btn._state = 0;
									$(btn).removeClass ('ui-state-active');
								}
								// Restore state
								htmlBtn._state = actState;
							}						
						
							if (htmlBtn._state === 1) {
								htmlBtn._state = 0;
								$(htmlBtn).removeClass ('ui-state-active');
							}
							else {
								htmlBtn._state = 1;
								$(htmlBtn).addClass ('ui-state-active');
							}
							// install filters handler
							if (div.barsIntern.wType == 'tplBarFilter') {
								var filter = "";
								for (var i = 0; i < div.barsOptions.buttons.length; i++) {
									if (document.getElementById (div.barsIntern.wid+"_btn"+i)._state === 1) {
										if (div.barsOptions.buttons[i].option != "") {
											filter += (filter == "" ? "" : ",") + div.barsOptions.buttons[i].option;
										}
										// If disable all filters
										else {
											filter = "";
											for (var j = 0; j < div.barsOptions.buttons.length; j++) {
												var btn = document.getElementById (div.barsIntern.wid+"_btn"+j);
												btn._state = 0;
												$(btn).removeClass ('ui-state-active');
											}
											break;
										}
									}
								}
								
								dui.changeFilter (filter, div.barsOptions.bShowEffect, div.barsOptions.bShowEffectMs, div.barsOptions.bHideEffect, div.barsOptions.bHideEffectMs);
							}
						}
					};
                }
			}
            else {
				jDiv.attr('data-dashui-resizable', '{"disabled":true}');
                div.dashuiCustomEdit = {'baroptions': dui.binds.bars.edit, 'delete': dui.binds.bars.editDelete};
            }
		}
	}
});