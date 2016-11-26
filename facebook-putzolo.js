// ==UserScript==
// @name         facebook putzolo
// @namespace    http://csillagtura.ro/less-facebook-suggestions-userscript
// @version      2016.11.26. 19:10
// @description  hides facebook dom elements like the annoying suggested posts/pages/people
// @author       VNP
// @match        https://www.facebook.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    function putzolo_string_fits_keywords(s){
        var hide = new Array("karácsony", "húsvét", 'christmas', 'ünnepek', "happy new year", "isten éltessen", "isten eltessen", "boldog szuletesnapot", "boldog születésnapot", "boldog szulinapot", "boldog szülinapot");
        var but_keep = new Array("karácsonyi zsolt", "karácsony ben");
        s = s.toLowerCase();
        for (var q=0; q<hide.length; q++){
            if (s.indexOf(hide[q]) > -1){
                var b = true;
                for (var i = 0; i<but_keep.length; i++){
                     if (s.indexOf(but_keep[q]) > -1){
                         b = false;
                     }
                }
                if (b){
                    return true;
                }
            }
        }
        return false;
    }
    function eventFire(el, etype){
      if (el.fireEvent) {
        el.fireEvent('on' + etype);
      } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
      }
    }
    function putzolo_onepostandmoreclick(){
        var contCol = document.getElementById("contentCol");
        if (!contCol){
            contCol = document.getElementById("contentArea");
        }
        if (!contCol){
            return ;
        }
        if (contCol.clientHeight < 1200){
            var lista = document.getElementsByTagName("a");
            for (var q=0; q<lista.length; q++){
                 if (lista[q].getAttribute("role") == "button"){
                   if (lista[q].innerHTML.toLowerCase().indexOf("more stories") > -1){
                       eventFire(lista[q], "click");
                   }
                 };
            }
        } 
    }
    function putzolo_post_fits_keywords(d){
        var at = "data-kwchk";
        var a = d.getAttribute(at);
        if (a){
            return (a=="3");
        }else{
            var s = d.innerHTML.split("<"+"form")[0];
            if (putzolo_string_fits_keywords(s)){
                d.setAttribute(at, "3");
                return true;
            }else{
                d.setAttribute(at, "2");
                return false;
            }
        }
    }
    function putzolo_is_this_to_be_hidden(s){
         if (
                     (s.indexOf("invite friends to like") > -1) ||
                     (s.indexOf("sponsored") > -1) ||
                     (s.indexOf("suggested pages") > -1) ||
                     (s.indexOf("buy and sell groups") > -1) ||
                     (s.indexOf("sale groups") > -1) ||
                     (s.indexOf("suggested groups") > -1) ||
                     (s.indexOf("page posts you") > -1) ||
                     (s.indexOf("you may like") > -1) ||
                     (s.indexOf("by writing a review") > -1) ||
                     (s.indexOf("people you may know") > -1) ||
                     (s.indexOf("improve your news feed") > -1) ||
                     (s.indexOf("suggested people") > -1)
        ){ 
             return true;
        };        
        return false;
    }
    
    window.putzoloInterval = -1;
    window.kliorInterval = window.clearInterval;
    window.kliorTimeout = window.clearTimeout;

    window.setInterval(function (){
        // preventing the page from restoring the original function
        window.clearInterval = function(intervalId) {
           if (intervalId != window.putzoloInterval){
               window.kliorInterval(intervalId); 
           }
        };
        window.clearTimeout = function(intervalId) {
           if (intervalId != window.putzoloInterval){
               window.kliorTimeout(intervalId); 
           }
        };
    }, 10);
    
    console.log("putzolo inited, intervalhandlers grabbed");
    
    function putzolo_putUIElements(){        
        var head = document.head || document.getElementsByTagName('head')[0];
        var bb = document.getElementById("pagelet_bluebar");
        if (!bb){
            //facebook has not loaded yet
            setTimeout(function (){
                putzolo_putUIElements();
            }, 100);
            return ;
        }
        //some extra css
        var css = ' .carouselParent { display: none; }'+
            ' #GroupsRHCSuggestionSection { display: none; } '+
            ' #wekker { position: fixed; left: 0px; top: 0px; width: 10px; height: 10px;} '+
            ' #elements_hidden_by_putzolo { z-index: 9999; position: fixed; height: 16px; width: 60px; top: 3px; left: 100%; margin-left: -90px; text-align: right; cursor: not-allowed; font-size: 10pt; padding: 3px; }'+
            ' #putzolo_ticker { z-index: 9999; position: fixed; left: 0px; top: 0px; height: 6px; width: 6px; overflow: hidden; background-color: yellow}';
        var style = document.createElement('style');    
        style.type = 'text/css';
        if (style.styleSheet){
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
        head.appendChild(style);

        if (bb){
            // this is the main facebook frame
            var lista = bb.getElementsByTagName("div");
            for (var q=0; q < lista.length; q++){
                var a = lista[q].getAttribute("role");
                if (a!="dialog"){
                    if (
                        (lista[q].parentNode == bb) || 
                        (lista[q].parentNode.parentNode == bb) || 
                        (lista[q].parentNode.parentNode.parentNode == bb)
                    ){
                        lista[q].style.backgroundColor = "green";
                    }                   
                };
            };           
            // lets put in a counter
            var counter = document.createElement("div");
            counter.title = "Elements hidden by putzolo, fb seems to be clearing the localstorage from time to time";
            counter.id = "elements_hidden_by_putzolo"; 
            var pc = localStorage.getItem("putzolo-counter");
            if (!pc){
                pc = "0";
            } 
            if (pc==""){
                pc = "0";
            }
            counter.innerHTML = pc;            
            document.body.appendChild(counter);

            var ticker = document.createElement("div");
            ticker.id = "putzolo_ticker";
            ticker.innerHTML = "&nbsp;"; 
            document.body.appendChild(ticker);
            
            window.putzolo_counter = counter;
            window.putzolo_ticker  = ticker;
        };        
    };
    
    putzolo_putUIElements();
    
    //setting up the interval that cleans the screen   
    window.putzoloInterval = setInterval(function (){
        var hidden_in_this_round = 0; 
        var lista = document.getElementsByClassName("userContentWrapper");
        for (var q=0; q < lista.length; q++){
            if (lista[q].style.display!="none"){
              if (lista[q].innerHTML.indexOf("ponsored") > -1){
                  lista[q].style.display = "none";
                  hidden_in_this_round++;
              }                
            };
            if (lista[q].style.display!="none"){
                if (putzolo_post_fits_keywords(lista[q])){
                    lista[q].style.opacity = 0.3;
                }
            };            
        }
        var lista = document.getElementsByTagName("div");
        for (var q = 0; q < lista.length; q++){ 
          if (lista[q].style.display!="none"){
            var a = lista[q].getAttribute("data-ownerid");
            if (a){
                a = String(a);
                if (a.indexOf("hyper") < 0){
                   var cn = " "+lista[q].className+" "; 
                   if (
                       (cn.indexOf(" uiContextualLayerPositioner ") < 0) && 
                       (cn.indexOf("Photo") < 0)
                      ){ 
                      if (lista[q].innerHTML != ""){ 
                         // lista[q].style.border = "5px solid orange";
                         lista[q].style.display = "none";
                         hidden_in_this_round++; 
                      };    
                   };
                };
                
            }
          }  
        }
        
        //in the feed
        var lista = document.getElementsByTagName("div");
        for (var q =0; q<lista.length; q++){
            if (parseInt(lista[q].getAttribute("data-fte")) == 1){
               if (lista[q].style.display!="none"){
                  var s = lista[q].innerHTML.toLowerCase();
                  if ( putzolo_is_this_to_be_hidden(s) ){
                     lista[q].style.display = "none";
                     hidden_in_this_round++; 
                  };
               }
            }  
        };             
        
        //sidebar on the right
        var lista = document.getElementsByClassName("ego_section");
        for (var q=0; q < lista.length; q++){
            if (lista[q].style.display!="none"){
                var s = lista[q].innerHTML.toLowerCase();
                if ( putzolo_is_this_to_be_hidden(s) ){
                    lista[q].style.display = "none";
                    hidden_in_this_round++;
                }
            };
        }                
        
        //install some bloated app
        var lista = document.getElementsByTagName("a");
        for (var q=0; q < lista.length; q++){
            if (lista[q].style.display!="none"){
                if (lista[q].href){
                    if (lista[q].href.indexOf("install_link") > 0){
                        lista[q].style.display = "none";
                        lista[q].parentNode.style.display = "none";
                        hidden_in_this_round++;
                    }
                }
            }
        }
        
        if (hidden_in_this_round > 0){
            if (window.putzolo_counter){
                window.putzolo_counter.innerHTML = parseInt(window.putzolo_counter.innerHTML) + hidden_in_this_round;
                localStorage.setItem("putzolo-counter", window.putzolo_counter.innerHTML);                
            }                
        }
        if (window.putzolo_ticker){
            if (window.putzolo_ticker.style.backgroundColor == "white"){
                window.putzolo_ticker.style.backgroundColor = "black";
            }else{
                window.putzolo_ticker.style.backgroundColor = "white";
            }
        }
        putzolo_onepostandmoreclick();
    }, 1000);
    
})();