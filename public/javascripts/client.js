function render(getJsonData){
    // 一旦全部の会話を消去してから再描画する（暫定：力技）
    document.getElementById('area').innerHTML = '';
    // 受信したjsonデータを自分と相手に分けて描画する
    for(var i in getJsonData){
        if(getJsonData[i].fromAddress==myid){
            var cts ="";

            cts =  "<div class='myText'>";
            cts += "  <div class='text'>"+ getJsonData[i].message + "</div>";
            cts += "  <div class='date'>"+ getJsonData[i].timeStamp + "</div>";
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
    if (text !=''){
        fetch('/api/messages', {
            method:"POST",
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify({mess: text}),
        })
        .then((data) => {
			console.log(data);
            getMessages();
            // 入力領域をクリアする
            document.getElementById('inp').value="";
        });
        
    }
}



// 3秒ごとに再描画のgetを行う
setInterval("getMessages()",3000);

$(getMessages);