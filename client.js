setBody = function(view){
  document.getElementById("body").innerHTML = view.innerHTML;
};

window.onload = function(){
  welcomeView = document.getElementById("welcomeView");
  profileView = document.getElementById("profileView");
  setBody(welcomeView);
};

var MINIMAL_PASSWORD_LENGTH = 6; //no magical numbers

function signIn(){
  email = document.getElementById("login_email").value;
  password = document.getElementById("login_password").value;
  var errorArea = document.getElementById("signInError");

  var returnCode = serverstub.signIn(email, password);

  if(returnCode.success){
    userEmail = email;
    userToken = returnCode.data;
    setBody(profileView);
    loadProfileView();
  }
  errorArea.innerHTML = returnCode.message;
}

function loadProfileView(){
  loadInfo();
  //loadHomeMessages();
  //loadBrowseInfo();
}

function signup(){
  inputForm = document.getElementById("signup_form");
  var errorArea = document.getElementById("signUpError");

  if(validatePassword(inputForm.password.value, inputForm.repeat_password.value, errorArea)){
    var newUser = {
      "email": inputForm.email.value,
      "password": inputForm.password.value,
      "firstname": inputForm.firstname.value,
      "familyname": inputForm.familyname.value,
      "gender": inputForm.gender.value,
      "city": inputForm.city.value,
      "country": inputForm.country.value
    }
    var returnCode = serverstub.signUp(newUser);
    errorArea.innerHTML  = returnCode.message;
  }
}

function validatePassword(password, repeatedPassword, error){
  if(password !== repeatedPassword){
      error.innerHTML = "Passwords don't match!"
      return false;
  }
  if(password< MINIMAL_PASSWORD_LENGTH){
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
    var returnCode = serverstub.changePassword(userToken, oldPass, newPass);
  }
  errorArea.innerHTML = returnCode.message;
}

function signOut(){
  var returnCode = serverstub.signOut(userToken);
  if(returnCode.success){
    setBody(welcomeView);
  }
}

function loadInfo(){
    var returnCode = serverstub.getUserDataByToken(userToken);

    if(returnCode.success){
      var user = returnCode.data;
      document.getElementById("nameLabel").innerHTML = "Name: " + user.firstname + " " + user.familyname;
      document.getElementById("genderLabel").innerHTML = "Gender: " + user.gender;
      document.getElementById("cityLabel").innerHTML = "City: " + user.city;
      document.getElementById("countryLabel").innerHTML = "Country: " + user.country;
      document.getElementById("emailLabel").innerHTML = "Email: " + user.email;
    }
}

function loadHomeMessages(){
  var returnCode = serverstub.getUserMessagesByToken(userToken);

  if(returnCode.success){
    var messages = returnCode.data;
    document.getElementById("messageWall").innerHTML = null;

    for (i = 0; i < messages.length; i++) {
      document.getElementById("messageWall").innerHTML += "<p>From: " + messages[i].writer + "<br>";
      document.getElementById("messageWall").innerHTML += messages[i].content + "<br></p>";
    }
  }
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
  var returnCode = serverstub.postMessage(userToken, input, toEmail);
  errorArea.innerHTML = returnCode.message;
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
