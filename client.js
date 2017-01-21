setBody = function(view){
  document.getElementById("body").innerHTML = view.innerHTML;
};

window.onload = function(){
  welcomeView = document.getElementById("welcomeView");
  profileView = document.getElementById("profileView");

  setBody(welcomeView);
};

var MINIMAL_PASSWORD_LENGTH = 6; //no magical numbers

function login(){
  email = document.getElementById("login_email");
  password = document.getElementById("login_password");

  serverstub.signIn(email, password);
}

function signup(){
  inputForm = document.getElementById("signup_form");

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
    alert(returnCode.message);
  }
}

function validateSignUp(inputForm){
  if(inputForm.password.value === inputForm.repeat_password.value &&
    inputForm.password.value.length >= MINIMAL_PASSWORD_LENGTH){
      return true;
  }
  return false;
}
