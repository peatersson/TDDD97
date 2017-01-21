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
  }
}

function signup(){
  inputForm = document.getElementById("signup_form");
  var errorArea = document.getElementById("signUpError");

  if(validateSignUp(inputForm)){
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

function validateSignUp(inputForm){
  if(inputForm.password.value !== inputForm.repeat_password.value){
      errorArea.innerHTML = "Passwords don't match!"
      return false;
  }
  if(inputForm.password.value.length < MINIMAL_PASSWORD_LENGTH){
      errorArea.innerHTML = "Passwords too short"
      return false;
  }
  return true;
}
