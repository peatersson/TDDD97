setBody = function(view){
  document.getElementById("body").innerHTML = view.innerHTML;
};

window.onload = function(){
  welcomeView = document.getElementById("welcomeView");
  profileView = document.getElementById("profileView");
  setBody(welcomeView);
};

var MINIMAL_PASSWORD_LENGTH = 6; //no magical numbers

var userEmail = null;
var userToken = null;

function postRequest(request, url, data){
    request.open("POST", url, true);
	request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	request.send(data);
}

function createHash(params){
    hash =  CryptoJS.SHA512(params+userToken);
    return hash.toString();
}

function signIn(){
  createHash("test");
  email = document.getElementById("login_email").value;
  password = document.getElementById("login_password").value;
  var errorArea = document.getElementById("signInError");

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange=function(){
	  if (xhttp.readyState==4 && xhttp.status==200){
		    var returnCode = JSON.parse(xhttp.responseText);
			if(returnCode.success){
				userToken = returnCode.data;
				userEmail = email;
				setBody(profileView);
				loadProfileView();
				connectSocket();
			}else{
				errorArea.innerHTML = returnCode.message;
			}
	    }
	}
	params = "&email=" + email + "&password=" + password + "&hash";
	hash_params = createHash(params);
    postRequest(xhttp,"/signIn", params + hash_params);
}

function loadProfileView(){
  loadInfo();
  loadHomeMessages();
}

function signup(){
  inputForm = document.getElementById("signup_form");
  var errorArea = document.getElementById("signUpError");

  if(validatePassword(inputForm.password.value, inputForm.repeat_password.value, errorArea)){
      email =  inputForm.email.value,
      password = inputForm.password.value,
      firstname = inputForm.firstname.value,
      familyname = inputForm.familyname.value,
      gender = inputForm.gender.value,
      city = inputForm.city.value,
      country = inputForm.country.value
  }

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange=function(){
	  if (xhttp.readyState==4 && xhttp.status==200){
		    var returnCode = JSON.parse(xhttp.responseText);
			errorArea.innerHTML = returnCode.message;
	   }
  }
    data = "&email="+email+"&password="+password+"&firstname="+firstname+"&familyname="+familyname+"&gender="+gender+"&city="+city+"&country="+country;
    postRequest(xhttp,"/signUp", data);
}

function validatePassword(password, repeatedPassword, error){
  if(password !== repeatedPassword){
      error.innerHTML = "Passwords don't match!"
      return false;
  }
  if(password.length < MINIMAL_PASSWORD_LENGTH){
      error.innerHTML = "Password too short"
      return false;
  }
  return true;
}

function changePassword(){
    var oldPass = document.getElementById("oldPass").value;
    var newPass = document.getElementById("newPass").value;
    var repeatNewPass = document.getElementById("repeatNewPass").value;
    var errorArea = document.getElementById("changePassError");

    if(validatePassword(newPass, repeatNewPass, errorArea)){
    var xhttp = new XMLHttpRequest();
     xhttp.onreadystatechange=function(){
      if (xhttp.readyState==4 && xhttp.status==200){
            var returnCode = JSON.parse(xhttp.responseText);
            errorArea.innerHTML = returnCode.message;
       }
    }
    data = "&email="+userEmail+"&old="+oldPass+"&new="+newPass+"&hash=";
    hash_params = createHash(data);
    postRequest(xhttp,"/changePass", data + hash_params);
  }
}

function signOut(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange=function(){
      if (xhttp.readyState==4 && xhttp.status==200){
            var returnCode = JSON.parse(xhttp.responseText);
            setBody(welcomeView);
            var errorArea = document.getElementById("signInError");
            errorArea.innerHTML = returnCode.message;
       }
    }
    params = "&email="+userEmail+"&hash=";
    hash_params = createHash(params);
    postRequest(xhttp,"/signOut", params + hash_params);
}

function loadInfo(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange=function(){
      if (xhttp.readyState==4 && xhttp.status==200){
            var returnCode = JSON.parse(xhttp.responseText);
            if(returnCode.success){
                var user = returnCode.data;
                document.getElementById("nameLabel").innerHTML = "Name: " + user.firstname + " " + user.familyname;
                document.getElementById("genderLabel").innerHTML = "Gender: " + user.gender;
                document.getElementById("cityLabel").innerHTML = "City: " + user.city;
                document.getElementById("countryLabel").innerHTML = "Country: " + user.country;
                document.getElementById("emailLabel").innerHTML = "Email: " + user.email;
            }
      }
    }
    params = "&email="+userEmail+"&hash=";
    hashed_params = createHash(params);
    postRequest(xhttp,"/getUserDataByToken", params + hashed_params);
}

function loadHomeMessages(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange=function(){
        if (xhttp.readyState==4 && xhttp.status==200){
	        var returnCode = JSON.parse(xhttp.responseText);
	        if(returnCode.success){
                var messages = returnCode.data;
                document.getElementById("messageWall").innerHTML = null;
                for (i = 0; i < messages.length; i++) {
                    document.getElementById("messageWall").innerHTML +=
                    "<p id=\"drag"+i+"\" draggable=\"true\" ondragstart=\"drag(event)\">" + messages[i].writer + "<br>" + messages[i].content + "</p> <br>";
                }
            }
        }
    }
    data = "&email="+userEmail+"&hash=";
    hashed_params = createHash(data);
    postRequest(xhttp,"/getUserMessagesByToken", data+hashed_params);
}

function postMessage(toEmail){
  var errorArea = null;
  var input = null;
  if(toEmail == null){
        toEmail = userEmail;
        errorArea = document.getElementById("postMessageError");
        input = document.getElementById("postBox").value;
  }else{
        errorArea = document.getElementById("browsePostMessageError");
        input = document.getElementById("browsePostBox").value
  }
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange=function(){
        if (xhttp.readyState==4 && xhttp.status==200){
	        var returnCode = JSON.parse(xhttp.responseText);
	        errorArea.innerHTML = returnCode.message;
        }
  }
  data = "&email="+userEmail+"&toEmail="+toEmail+"&message="+input+"&hash=";
  hashed_params = createHash(data);
  postRequest(xhttp,"/postMessage", data + hashed_params);
  toEmail = null;
}

var searchedUser = null;
function searchUser(){
  email = document.getElementById("searchField").value;

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange=function(){
        if (xhttp.readyState==4 && xhttp.status==200){
	        var returnCode = JSON.parse(xhttp.responseText);
	        if(returnCode.success){
                searchedUser = email;
                var user = returnCode.data;
                document.getElementById("browseNameLabel").innerHTML = "Name: " + user.firstname + " " + user.familyname;
                document.getElementById("browseGenderLabel").innerHTML = "Gender: " + user.gender;
                document.getElementById("browseCityLabel").innerHTML = "City: " + user.city;
                document.getElementById("browseCountryLabel").innerHTML = "Country: " + user.country;
                document.getElementById("browseEmailLabel").innerHTML = "Email: " + user.email;
                document.getElementById("browseHeadingUser").innerHTML = "Post a message to " + user.firstname;
                loadBrowseMessages();
            }
            document.getElementById("searchUserError").innerHTML = returnCode.message;
        }
  }
  data = "&email="+userEmail+"&searched="+email+"&hash=";
  hashed_params = createHash(data);
  postRequest(xhttp,"/getUserDataByEmail", data + hashed_params);
}

function loadBrowseMessages(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange=function(){
        if (xhttp.readyState==4 && xhttp.status==200){
	        var returnCode = JSON.parse(xhttp.responseText);
	        if(returnCode.success){
                var messages = returnCode.data;
                document.getElementById("browseMessageWall").innerHTML = null;
                document.getElementById("message") = null;
                for (i = 0; i < messages.length; i++) {
                    document.getElementById("message").innerHTML += "<p>From: " + messages[i].writer + "<br>";
                    document.getElementById("message").innerHTML += messages[i].content + "<br></p>";
                    document.getElementById("browseMessageWall").innerHTML += document.getElementById("message").innerHTML;
                }
            }
        }
    }
    data = "&email="+userEmail+"&searched="+searchedUser+"&hash=";
    hashed_params = createHash(data);
    postRequest(xhttp,"/getMessageByEmail", data + hashed_params);
}

function postMessageToUser(){
  postMessage(searchedUser);
}


function connectSocket(){
    url = "ws://" + document.domain + ":5000/socket";
    ws = new WebSocket(url);

    ws.onopen = function() {
        user = {"email":userEmail, "hash": createHash(email)};
		ws.send(JSON.stringify(user));
		console.log(JSON.stringify(user));
	};
	ws.onmessage = function(msg) {
		serverMsg = JSON.parse(msg.data);
		if (serverMsg.success){
		    // should never happend
		}else{
		    if (serverMsg.data.statusCode == 1){
		        userToken = null;
		        userEmail = null;
		        setBody(welcomeView);
		        document.getElementById("signInError").innerHTML = serverMsg.message;
		    }
		}
	};
	ws.onclose = function() {
		console.log("WebSocket closed");
	};
	ws.onerror = function() {
		console.log("ERROR!");
	};
}

function allowDrop(ev) {
    ev.preventDefault();
}

message_to_be_deleted = null;

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    ev.target.appendChild(document.getElementById(data));
}

function deleteMessage(ev, target){
    message_to_be_deleted = ev.dataTransfer.getData("text");

    // byt så att messages har elementId som sitt inre id
    // skicka remove_message till servern
}
/*
WHAT THE HELL?! YOU CANNOT RECEIVE WHAT HAS'NT BEEN SENT?!
*/

/*
This things consist of many things.

.
.
.
.
.
.

Ya?
*/

/*
Nota-belle?
*/

/*
Registered as sent, BUT NOOOOOOOOOOOT AS RECEIVED?!?!?!
*/
