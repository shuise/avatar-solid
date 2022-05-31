(function(){
	setTimeout(run, 1000);

	function run(){
		let appTpl = `<div>
			<div class="rabbit-hole-form">
				<input type="text" id="rabbit-hole-username" value="那英" /> 账号名称<br>
				<input type="text" id="rabbit-hole-homepage" value="https://weibo.com/u/1719232542" /> 微博主页<br>
				<button id="rabbit-hole-btn">获取社交关系数据</button>
			</div>
		</div>`;

	    let app = document.createElement('div');
	    	app.className = 'rabbit-hole-wrapper';
	    app.innerHTML = appTpl;
	    document.body.appendChild(app);

	    let target = document.getElementById('rabbit-hole-btn');
	    target.onclick = function(){
			let user = document.getElementById('rabbit-hole-username');
			let username = user.value;
			if(!username){
				alert('请输入账号名称');
				return;
			}

			let inp = document.getElementById('rabbit-hole-homepage');
			let url = inp.value;
	    	exportsGraph(username, url);
	    }
	}

	function exportsGraph(username, url){
		if(!url){
			alert('请输入地址');
			return false;
		}
		let _flag = 'https://weibo.com/u/';
		if(url.indexOf(_flag) == 0){
			let uid = url.split(_flag)[1] || '';
				uid = uid.split('?')[0] || '';
			if(!uid || !(uid - 1)){
				alert('请输入正确的地址');
			}

		    //发送创建请求
		    console.log(uid, 1);
			gerFriend200(uid, function(friends){
				// console.log('friends', friends);
				// downloadGraph(users);
				gerFans200(uid, function(fans){
					// console.log('fans', fans);
					downloadGraph(username, friends, fans);
				});
			});
		}else{
			alert('请输入正确的地址');
		}
	}

	function downloadGraph(username, friends, fans){
		console.log('downloadGraph', username, friends, fans);

		let md = '# ' + username + ' 微博关系 \n\n';
		md += '## 关注的人 \n\n'
		md += createUserList(friends);
		md += '## 粉丝 \n\n'
		md += createUserList(fans);

		let fileName = username + '.md';
		let file = new File([ md ], fileName, { "type" : "text\/plain" });
	    let objectUrl = URL.createObjectURL(file);
		
		download(objectUrl, fileName);

		function createUserList(datas){
			let str = '';
			for(var index in datas){
				let users = datas[index];
				_.each(users, function(user){
					str += '\n[[' + user.screen_name + ']] ' + user.location + ', 主页：https://weibo.com/' + user.profile_url;
				})
			}
			return str;
		}

		function download(objectUrl, fileName) {
		    const tmpLink = document.createElement("a");
		    tmpLink.href = objectUrl;
		    tmpLink.download = fileName;
		    document.body.appendChild(tmpLink);
		    tmpLink.click();

		    document.body.removeChild(tmpLink);
		    URL.revokeObjectURL(objectUrl);
		}
	}

	function gerFriend200(uid, callback){
		var total = 0;
		var size = 20;
		var maxCount = 200;
		var pageCount = 1;
		var current = 1;
		var friendMap = {};

		gerFriends({
			uid: uid,
			pageNo: current
		}, function(res){
	    	total = res.total_number;
			total = Math.min(total, maxCount);
			pageCount = Math.ceil(total/size);
			
			friendMap[1] = res.users || [];

			for(var i=2; i < pageCount + 1; i++){
				(function(i){
					gerFriends({
						uid: uid,
						pageNo: i
					}, function(res){
						current += 1;
						friendMap[i] = res.users || [];
						if(current == pageCount){
							callback(friendMap);
						}
					});
				})(i);
			}
		});

		function gerFriends(data, _callback){
			console.log('gerFriends', data.pageNo);
			requestBridge({
		    	api: 'weibo.friends',
		    	type: 'request',
		    	data: {
		    		uid: data.uid,
		    		pageNo: data.pageNo
		    	}
		    }, function(res){
		    	_callback(res);
		    });
		}
	}

	function gerFans200(uid, callback){
		var total = 0;
		var size = 20;
		var maxCount = 200;
		var pageCount = 1;
		var current = 1;
		var friendMap = {};

		gerFans({
			uid: uid,
			pageNo: current
		}, function(res){
	    	total = res.total_number;
			total = Math.min(total, maxCount);
			pageCount = Math.ceil(total/size);
			
			friendMap[1] = res.users || [];

			for(var i=2; i < pageCount + 1; i++){
				(function(i){
					gerFans({
						uid: uid,
						pageNo: i
					}, function(res){
						current += 1;
						friendMap[i] = res.users || [];
						if(current == pageCount){
							callback(friendMap);
						}
					});
				})(i);
			}
		});

		function gerFans(data, _callback){
			console.log('gerFans', data.pageNo);
			requestBridge({
		    	api: 'weibo.fans',
		    	type: 'request',
		    	data: {
		    		uid: data.uid,
		    		pageNo: data.pageNo
		    	}
		    }, function(res){
		    	_callback(res);
		    });
		}
	}

	function requestBridge(data, callback){
	    //发送创建请求, 此 API 为 2.0
	    // console.log(chrome.extension.sendRequest, 'chrome.extension.sendRequest');
	    chrome.extension.sendRequest(data, function(response) {
	        callback(response);
	    });
	}
})();