// ==UserScript==
// @name         facebook putzolo
// @namespace    http://csillagtura.ro/less-facebook-suggestions-userscript
// @version      2016.12.14. 10:55
// @description  hides facebook dom elements like the annoying suggested posts/pages/people, needs fb to be in english
// @author       VNP
// @match        https://www.facebook.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /* 

    TIME

    taking over the timeouts and intervals,
    preventing loss of control

    */

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
        window.clearInterval.toString = function (){
            return "function clearInterval() { [native code] }"
        }
        window.clearTimeout = function(intervalId) {
           if (intervalId != window.putzoloInterval){
               window.kliorTimeout(intervalId); 
           }
        };
        window.clearTimeout.toString = function (){
            return "function clearTimeout() { [native code] }"
        }
    }, 10);
    console.log("putzolo inited, intervalhandlers grabbed");

    
    
    /*

    SIZE    

    the feed might get short - single post - after
    hiding feed elements fitting the criteria.
    execute a click on the more button

    */
    function putzolo_eventFire(el, etype){
      if (el.fireEvent) {
        el.fireEvent('on' + etype);
      } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
      }
    }
    function putzolo_fewPostsVisibleSoClickTheMoreButton(){
        var contCol = document.getElementById("contentCol");
        if (!contCol){
            contCol = document.getElementById("contentArea");
        }
        if (!contCol){
            return ;
        }
        if (contCol.clientHeight < 2000){
            var lista = document.getElementsByTagName("a");
            for (var q=0; q<lista.length; q++){
                 if (lista[q].getAttribute("role") == "button"){
                   if (lista[q].innerHTML.toLowerCase().indexOf("more stories") > -1){
                       putzolo_eventFire(lista[q], "click");
                   }
                 };
            }
        } 
    }

    /*
    
    UI
    
    Include some changes to the UI marking that putzolo has control
    
    */
    
    function putzolo_putUIElements(){        
        var head = document.head || document.getElementsByTagName('head')[0];
        var bb = document.getElementById("pagelet_bluebar");
        if (!bb){
            //facebook has not loaded yet, wait
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

    /*
    CHEESY
    
    Cats can not be hidden yet, but strings/posts that fit a keyword, can
    
    */
    
    function putzolo_getTheCheesyPairs(){
        var pairs = [];
        pairs.push({
             killIf:    ["kar"+String.fromCharCode(225)+"csony", "karacsony"],
             butKeepIf: ["kar"+String.fromCharCode(225)+"csonyi zsolt", "kar"+String.fromCharCode(225)+"csony ben", "zsolt kar", "karacsony beno", "karacsonyi zsolt" ]
        })
        pairs.push({
             killIf:    ["christmas"],
             butKeepIf: ["last christmas"]
        })
        pairs.push({
           killIf: [
            String.fromCharCode(252)+"nnepek", 
            "husvet", 
            "h"+String.fromCharCode(250)+"sv"+String.fromCharCode(233)+"t", 
            "happy new year",
            "isten "+String.fromCharCode(233)+"ltessen", 
            "isten eltessen", 
            "boldog szuletesnapot", 
            "boldog sz"+String.fromCharCode(252)+"let"+String.fromCharCode(233)+"snapot", 
            "boldog szulinapot", 
            "boldog sz"+String.fromCharCode(252)+"linapot"
                  ]
        });
        return pairs;
    }
    function putzolo_stringFitsCheesyKeywords(s){
        var p = putzolo_getTheCheesyPairs();        
        s = s.toLowerCase();
        
        for (var q=0; q<p.length; q++){
            var kill = false;
            for (var i=0; i<p[q].killIf.length; i++){
                if (s.indexOf(p[q].killIf[i]) > -1){
                    kill = true;
                }
            }
            if (p[q].butKeepIf){
                for (var i=0; i<p[q].butKeepIf.length; i++){
                    if (s.indexOf(p[q].butKeepIf[i]) > -1){
                        kill = false;
                    }
                }
            }
            if (kill){
                return true;
            }
        }
        
        return false;
    }    
    function putzolo_postFitsCheesyKeywords(d){
        var at = "data-kwchk";
        var a = d.getAttribute(at);
        if (a){
            return (a=="3");
        }else{
            var s = d.innerHTML.split("<"+"form")[0];
            if (putzolo_stringFitsCheesyKeywords(s)){
                d.setAttribute(at, "3");
                return true;
            }else{
                d.setAttribute(at, "2");
                return false;
            }
        }
    }
    
    /*
    
    PUTZOLO
    
    Clean up the UI from suggestions etc
    
    */
    
    function putzolo_isToBeHiddenJudgingByText(s){
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
                if (putzolo_postFitsCheesyKeywords(lista[q])){
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
                  if ( putzolo_isToBeHiddenJudgingByText(s) ){
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
                if ( putzolo_isToBeHiddenJudgingByText(s) ){
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
        
        // show feedback on the UI
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
        putzolo_fewPostsVisibleSoClickTheMoreButton();
    }, 1000);
    
})();