setBody = function(view){
  document.getElementById("body").innerHTML = view.innerHTML;
};

window.onload = function(){
  welcomeView = document.getElementById("welcomeView");
  profileView = document.getElementById("profileView");
  setBody(welcomeView);
};

var MINIMAL_PASSWORD_LENGTH = 6; //no magical numbers

function postRequest(request, url, data){
    request.open("POST", url, true);
	request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	request.send(data);
}

function signIn(){
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
			}else{
				errorArea.innerHTML = returnCode.message;
			}
	    }
	}
  postRequest(xhttp,"/signIn", "email=" + email + "&password=" + password );
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
    data = "email="+email+"&password="+password+"&firstname="+firstname+"&familyname="+familyname+"&gender="+gender+"&city="+city+"&country="+country;
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
    data = "&old="+oldPass+"&new="+newPass+"&token="+userToken;
    postRequest(xhttp,"/changePass", data);
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
    postRequest(xhttp,"/signOut", "token="+userToken);
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
    postRequest(xhttp,"/getUserDataByToken", "token="+userToken);
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
                    document.getElementById("messageWall").innerHTML += "<p>From: " + messages[i].writer + "<br>";
                    document.getElementById("messageWall").innerHTML += messages[i].content + "<br></p>";
                }
            }
        }
    }
    data = "&token="+userToken;
    postRequest(xhttp,"/getUserMessagesByToken", data);
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
  data = "&token="+userToken+"&email="+toEmail+"&message="+input;
  postRequest(xhttp,"/postMessage", data);
  toEmail = null;
}

var searchedUser = null;
function searchUser(){
  email = document.getElementById("searchField").value;
  var returnCode = serverstub.getUserDataByEmail(userToken, email);
  var errorArea = document.getElementById("searchUserError");

  if(returnCode.success){
    searchedUser = email;
    var user = returnCode.data;
    document.getElementById("browseNameLabel").innerHTML = "Name: " + user.firstname + " " + user.familyname;
    document.getElementById("browseGenderLabel").innerHTML = "Gender: " + user.gender;
    document.getElementById("browseCityLabel").innerHTML = "City: " + user.city;
    document.getElementById("browseCountryLabel").innerHTML = "Country: " + user.country;
    document.getElementById("browseEmailLabel").innerHTML = "Email: " + user.email;
    document.getElementById("browseHeadingUser").innerHTML += user.firstname;
    loadBrowseMessages();
  }
  errorArea.innerHTML = returnCode.message;
}

function loadBrowseMessages(){
  var returnCode = serverstub.getUserMessagesByEmail(userToken, searchedUser);

  if(returnCode.success){
    var messages = returnCode.data;
    document.getElementById("browseMessageWall").innerHTML = null;
    for (i = 0; i < messages.length; i++) {
      document.getElementById("browseMessageWall").innerHTML += "<p>From: " + messages[i].writer + "<br>";
      document.getElementById("browseMessageWall").innerHTML += messages[i].content + "<br></p>";
    }
  }
}

function postMessageToUser(){
  postMessage(searchedUser);
}
