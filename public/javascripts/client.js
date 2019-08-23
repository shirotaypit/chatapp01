function render(getJsonData){
    // 一旦全部の会話を消去してから再描画する（暫定：力技）
    document.getElementById('area').innerHTML = '';
    // 受信したjsonデータを自分と相手に分けて描画する
	console.log(getJsonData);
    for(var i in getJsonData){
		var imgHtml ="";
        if(getJsonData[i].fromAddress==myid){
            var cts ="";
			var imgHtml ="";
            cts =  "<div class='myText'>";
			
		if(getJsonData[i].message && !getJsonData[i].image ){
            cts += "  <div class='text'>"+ getJsonData[i].message + "</div>";
	        cts += "  <div class='date'>"+ getJsonData[i].timeStamp + "</div>";
		}
		if(getJsonData[i].image && !getJsonData[i].message){
		    cts += "  <div class='imageData'><img src='"+getJsonData[i].image+"'  height='120px' width='140px' style='border-radius:5px;'/></div>";
            cts += "  <div class='imageDate'>"+ getJsonData[i].timeStamp + "</div>";
		}
		if(getJsonData[i].image && getJsonData[i].message){
			 cts += "  <div class='text'>"+ getJsonData[i].message + "</div>";
	        cts += "  <div class='date'>"+ getJsonData[i].timeStamp + "</div>";
			cts += "  <div class='imageData'><img src='"+getJsonData[i].image+"'  height='120px' width='140px' style='border-radius:5px;'/><div>";
            cts += "  <div class='textImageDate'>"+ getJsonData[i].timeStamp + "</div>";
		}
            cts += "</div>";
		$('.contents').append(cts);

        } else {
            var cts ="";

            cts =  "<div class='flText'>"; 
            // 友達IDからアイコン画像ファイル名を生成している
            cts += "  <figure><img src='images/" + f1id + ".jpg'/></figure>";
            cts += "  <div class='flText-text'>";
            cts += "    <div class='text'>"+ getJsonData[i].message + "</div>";
            cts += "    <div class='date'>"+ getJsonData[i].timeStamp + "</div>";
            cts += "  </div>";
            cts += "</div>";
            $('.contents').append(cts);
        }
    }
    // 描画が終わったら画面下までスクロールさせる
    var obj = document.getElementById('area');
    obj.scrollTop = document.getElementById('area').scrollHeight;
}

// getを行いjsonデータを受領して描画関数に渡す
function getMessages(){
    fetch('/api/messages')
        .then((data) => data.json())
        .then((json) => {
            var getJsonData = json;
            render(getJsonData);
        });
}

// 入力データをサーバーにポストする
function pushMessage(){
    var text = $(".newMessage").val();
	var imageData = $(".imageData").val();

    if (text !='' || imageData !=''){
        fetch('/api/messages', {
            method:"POST",
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify({mess: text, image: imageData}),
        })
        .then((data) => {
			console.log(data);
            getMessages();
            // 入力領域をクリアする
            document.getElementById('inp').value="";
        });
        
    }
}
$(function(){
$("#upload-link").on('click', function(e){
        e.preventDefault();
        $("#imageFiles").trigger('click');
    });
});

$(function(){
$("#imageFiles").on("change", function(evt) {
		document.getElementById('error').innerHTML = '';
		var files = evt.target.files;
		if(files.length == 0) return;
		targetFile = files[0];
		if(!targetFile.type.match(/image/)) {
		document.getElementById("error").innerHTML ='Select Image File';
			return;
		}
		var breader = new FileReader();
	    breader.onload = readJPEGFile;
		breader.readAsBinaryString(targetFile);
		
	
	}); 
});

function readJPEGFile(evt) {
	
		var bin = evt.target.result;
		var sigJFIF = String.fromCharCode(0x4A, 0x46, 0x49, 0x46, 0x00);
		var sigEXIF = String.fromCharCode(0x45, 0x78, 0x69, 0x66, 0x00);
		var head = bin.substr(6, 5);
		
		if(sigJFIF != head && sigEXIF!= head) {
			document.getElementById("error").innerHTML ="Image file type should be JPEG";
			return;
		}
		
		var reader = new FileReader();
		reader.onload = function(e) {
		var image = new Image();
		image.src = reader.result;
		image.onload = function () {

		var height = this.height;
		var width = this.width;
		if (height > 300 && width > 400) {
			document.getElementById("error").innerHTML ='Image file size should be less than 400 x 300';
			return;
		}else {
			$(".imageData").val(reader.result);
			pushMessage();
		}
		}	
		}
		reader.readAsDataURL(targetFile);
		
}

// 3秒ごとに再描画のgetを行う
setInterval("getMessages()",3000);

$(getMessages);