function openCity(evt, cityName) {
  // Declare all variables
  var i, tabcontent, tablinks;
  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " active";

  document.getElementById('blocklyDiv').innerHTML = "";

  var demoWorkspace = Blockly.inject('blocklyDiv', {
    media: '../media/',
    toolbox: document.getElementById('toolbox')
  });
  Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'), demoWorkspace);
}

function destroyClickedElement(event) {
  // remove the link from the DOM
  document.body.removeChild(event.target);
}

var video = document.querySelector("#videoElement");

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({
      video: true
    })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err0r) {
      console.log("Something went wrong!");
    });
}

var editor = CodeMirror.fromTextArea(myTextarea, {
  lineNumbers: true
});

var consoleRunElement = document.getElementById('runCodeSnippetButton')


consoleRunElement.addEventListener('click', function () {
  var consoleLogElement = document.getElementById('consoleLogArea');

  var snippetText;
  if (editor) {
    snippetText = editor.getValue();
  } else {
    //snippetText = this.parentElement.previousElementSibling.innerText;
  }

  executeCodeSnippet(consoleLogElement, snippetText);
});

function getLineNumber(error) {
  try {
    // firefox
    const firefoxRegex = /eval:(\d+):\d+/;
    if (error.stack.match(firefoxRegex)) {
      const res = error.stack.match(firefoxRegex);
      return parseInt(res[1], 10);
    }

    // chrome
    const chromeRegex = /eval.+:(\d+):\d+/;
    if (error.stack.match(chromeRegex)) {
      const res = error.stack.match(chromeRegex);
      return parseInt(res[1], 10);
    }

  } catch (e) {
    return;
  }

  // We found nothing
  return;
}


async function executeCodeSnippet(consoleLogElement, codeSnippet) {
  consoleLogElement.innerText = '';
  var oldLog = console.log;
  console.log = function (...values) {
    let logStrs = [];
    for (let i = 0; i < values.length; i++) {
      const value = values[i];

      let logStr;
      if (value.toString == null) {
        logStr = value;
      } else {
        const toStr = value.toString();

        if (toStr === '[object Object]') {
          logStr = JSON.stringify(value, null, 2);
        } else {
          logStr = toStr;
        }
        logStrs.push(logStr);
      }
    }
    consoleLogElement.innerHTML += logStrs.join(' ') + '\n';
  };

  function reportError(e) {
    var errorMessage = '\n<div class="snippet-error"><em>An error occured';
    var lineNumber = getLineNumber(e);
    if (lineNumber !== undefined) {
      errorMessage += ' on line: ' + lineNumber + '</em>';
    } else {
      errorMessage += '</em>'
    }
    errorMessage += '<br/>';
    errorMessage += '<div class="snippet-error-msg">' + e.message + '</div>';
    errorMessage += '</div>';

    console.log(errorMessage);
  }

  // It is important that codeSnippet and 'try {' be on the same line
  // in order to not modify the line number on an error.
  const evalString = '(async function runner() { try { ' + codeSnippet +
    '} catch (e) { reportError(e); } })()';

  /*if (window._tfengine && window._tfengine.startScope) {
    window._tfengine.startScope();
  } else {
    tf.ENV.engine.startScope()
  }*/

  // this outer try is for errors that prevent the snippet from being parsed.
  try {
    await eval(evalString).catch(function (e) {
      // This catch is for errors within promises within snippets
      reportError(e);
    });
  } catch (e) {
    reportError(e);
  }


  /*if (window._tfengine && window._tfengine.endScope) {
    window._tfengine.endScope();
  } else {
    tf.ENV.engine.endScope();
  }*/

  console.log = oldLog;
};

//save project

function saveStringToFile(fileName, str){
    
  var textFileAsBlob = new Blob([str], {
    type: 'text/plain'
  });
  var fileNameToSaveAs = fileName;

  var downloadLink = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  downloadLink.innerHTML = "Download File";
  if (window.webkitURL != null) {
    // Chrome allows the link to be clicked without actually adding it to the DOM.
    downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
  } else {
    // Firefox requires the link to be added to the DOM before it can be clicked.
    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
  }

  downloadLink.click();
}

function saveTextAsFile(){

  var xmlString = "<project></project>";
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(xmlString, "text/xml"); //important to use "text/xml"

  newCode = xmlDoc.createElement("code");
  newCodeText=xmlDoc.createTextNode(editor.getValue());
  newCode.appendChild(newCodeText);

  newBlockly = xmlDoc.createElement("blockly");
  newBlocklyText=xmlDoc.createTextNode("blocklyText");
  newBlockly.appendChild(newBlocklyText);

  newAI = xmlDoc.createElement("ai");
  newAIText=xmlDoc.createTextNode("aiText");
  newAI.appendChild(newAIText);

  xmlDoc.getElementsByTagName("project")[0].appendChild(newCode);  
  xmlDoc.getElementsByTagName("project")[0].appendChild(newBlockly); 
  xmlDoc.getElementsByTagName("project")[0].appendChild(newAI); 

  var serializer = new XMLSerializer();
  var xmlString = serializer.serializeToString(xmlDoc);

  saveStringToFile("project.xml", xmlString);   
}