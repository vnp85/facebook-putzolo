// ==UserScript==
// @name         facebook putzolo
// @namespace    http://csillagtura.ro/less-facebook-suggestions-userscript
// @version      2016.09.21. 22:57
// @description  hides facebook dom elements like the annoying suggested posts/pages/people
// @author       VNP
// @match        https://www.facebook.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    //prevent the page from deleting my interval
    function putzolo_is_this_to_be_hidden(s){
         if (
                     (s.indexOf("invite friends to like") > -1) ||
                     (s.indexOf("sponsored") > -1) ||
                     (s.indexOf("suggested pages") > -1) ||
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
    
    //some extra css
    var css = ' .carouselParent { display: none; }'+
              ' #GroupsRHCSuggestionSection { display: none; } '+
              ' #wekker { position: fixed; left: 0px; top: 0px; width: 10px; height: 10px;} '+
              ' #elements_hidden_by_putzolo { z-index: 9999; position: fixed; height: 16px; width: 60px; top: 3px; left: 100%; margin-left: -90px; text-align: right; cursor: not-allowed; font-size: 10pt; padding: 3px; }'+
              ' #putzolo_ticker { z-index: 9999; position: fixed; left: 0px; top: 0px; height: 6px; width: 6px; overflow: hidden; background-color: yellow}';
    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');    
    style.type = 'text/css';
    if (style.styleSheet){
       style.styleSheet.cssText = css;
    } else {
       style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style);
    
    var bb = document.getElementById("pagelet_bluebar");
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
    };        
    
    /////setting up the interval that cleans the screen   
    window.putzoloInterval = setInterval(function (){
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

        var hidden_in_this_round = 0; 
        var lista = document.getElementsByClassName("userContentWrapper");
        for (var q=0; q < lista.length; q++){
            if (lista[q].style.display!="none"){
              if (lista[q].innerHTML.indexOf("ponsored") > -1){
                  lista[q].style.display = "none";
                  hidden_in_this_round++;
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
        
        if (hidden_in_this_round > 0){
            if (counter){
                counter.innerHTML = parseInt(counter.innerHTML) + hidden_in_this_round;
                localStorage.setItem("putzolo-counter", counter.innerHTML);                
            }                
        }
        if (ticker){
            if (ticker.style.backgroundColor == "white"){
                ticker.style.backgroundColor = "black";
            }else{
                ticker.style.backgroundColor = "white";
            }
        }
    }, 1000);
    
})();