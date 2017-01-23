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
    loadHomeInfo();
    //loadBrowse();
  }
  errorArea.innerHTML = returnCode.message;
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

function loadHomeInfo(){
    var returnCode = serverstub.getUserDataByToken(userToken);
    var user = returnCode.data;

    if(returnCode.success){
      document.getElementById("nameLabel").innerHTML = "Name: " + user.firstname + " " + user.familyname;
      document.getElementById("genderLabel").innerHTML = "Gender: " + user.gender;
      document.getElementById("cityLabel").innerHTML = "City: " + user.city;
      document.getElementById("countryLabel").innerHTML = "Country: " + user.country;
      document.getElementById("emailLabel").innerHTML = "Email: " + user.email;
    }
  }
