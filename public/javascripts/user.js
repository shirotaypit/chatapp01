function authenticateUser() {
		var formEl = document.getElementById('login-form');


  

  var formData = {};
  for (var i = 0; i < formEl.length; ++i) {
    //formData.append(formEl[i].name, formEl[i].value);
	//formData.append('json', JSON.stringify({"example": 'return value'}))
  }
  var temp = {"nickName" : formEl[0].value,"passCode" : formEl[1].value};
  formData = JSON.stringify(temp);
  // This is for the purpose of this demo using jsFiddle AJAX Request endpoint
  //formData.append('json', JSON.stringify({example: 'return value'}));
        fetch('/auth', {
            method:"POST",
            headers: {'Content-Type': 'application/json'},
            body: formData,
        }).then((data) => {
			window.location.href ="/home";
           
        });

}
