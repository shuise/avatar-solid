(function(){
	let host = location.host;
	if(host.indexOf('weibo.com') > -1){
		setTimeout(runWeibo, 1000);		
	}
	if(host.indexOf('flomoapp.com') > -1){
		setTimeout(runFlomo, 100);		
	}
	if(host.indexOf('douban.com') > -1){
		setTimeout(runDouban, 100);		
	}

	//豆瓣
	function runDouban(){
		let appTpl = `<button id="rabbit-hole-btn">导出阅读笔记</button>`;

	    let app = document.createElement('div');
	    	app.className = 'rabbit-hole-flomo';
	    app.innerHTML = appTpl;
	    document.body.appendChild(app);

	    let target = document.getElementById('rabbit-hole-btn');
	    target.onclick = function(){
	    	getDoubanReads(function(notes){
	    		exportDoubanNotes(notes);
	    	});
	    }
	}

	function getDoubanReads(callback){
		var results = {};
		requestBridge({
	    	api: 'douban.books',
	    	type: 'request',
	    	data: {}
	    }, function(res){
	    	let bookIds = res.worksIds || [];
	    	let total = bookIds.length;
	    	console.log(total, 'total', bookIds);
	    	let count = 0;

	    	// getBookInfos(bookIds);
	    	// return;
	    	_.each(bookIds, function(bookId){
	    		// requestBridge({
			    // 	api: 'douban.detail',
			    // 	type: 'request',
			    // 	data: {
			    // 		bookId: bookId
			    // 	}
			    // }, function(res){
			    // 	console.log(res);
			    // });
	    		requestBridge({
			    	api: 'douban.notes',
			    	type: 'request',
			    	data: {
			    		bookId: bookId
			    	}
			    }, function(res){
			    	if(res.length > 0){
			    		results[bookId] = res;			    		
			    	}
	    			count += 1;
			    	if(count >= total){
			    		callback(results);
			    	}
			    });
	    	});
	    });
	}

	function getBookInfos(ids){
		let query = "\n  query getWorksList($worksIds: [ID!]) {\n    worksList(worksIds: $worksIds) {\n      \n  ... on WorksBase {\n    id\n    title\n    url\n    readerUrl\n    cover\n    author {\n      name\n    }\n    origAuthor {\n      name\n    }\n    wordCount\n    wordCountUnit\n    isOrigin\n    isColumn\n    isFinished\n    isPurchased\n    isOnSale\n    progressRatio\n  }\n  ... on ColumnWorks {\n    columnId\n    libraryUpdateTime(format: ISO)\n    updateTime(format: ISO)\n    rally {\n      season\n      isCurrentSeason\n      writingStarted\n      writingStage: stage(name: \"StageWriting\") {\n        startTime(format: ISO)\n        isStarted\n      }\n      voteStage: stage(name: \"StageVote\") {\n        isActive\n      }\n    }\n  }\n\n    }\n  }\n";
		let data = {
			operationName: "getWorksList",
			query: query,
			variables: {worksIds: ids}
		}
		requestBridge({
	    	api: 'douban.bookInfo',
	    	type: 'request',
	    	data: data
	    }, function(res){
	    	console.log('getBookInfos', res);
	    });
	}

	function exportDoubanNotes(books){
		console.log(books);
		// 初始化一个zip打包对象
		var zip = new JSZip();

		for(var bookId in books){
			// 创建一个被用来打包的名为Hello.txt的文件
			let fileName = bookId + ".md";
			let content = createNote(bookId, books[bookId]);
			console.log(fileName, books[bookId]);
			zip.file(fileName, content);				
		}
		console.log('over');
		// 把打包内容异步转成blob二进制格式
		zip.generateAsync({type:"blob"}).then(function(content) {
		    saveAs(content, "豆瓣书摘.zip");
		});

		function createNote(bookId, notes){
			let md = '原书： https://read.douban.com/ebook/' + bookId + '\n\n';

			_.each(notes, function(note){
				md += '\n' + (note.extra || {}).text + '\n';

				md += note.note + '\n';

				if(note.tags.length > 0){
					md += '\n标签：';
					_.each(note.tags, function(tag){
						md += ' #' + tag + ' '
					});	
					md += '\n';
				}
				md += '创建时间：' + CRS.dateFormat(note.create_time) + '\n';
				md += note.owner.name +  '：' + note.owner.url + '\n';
			});
			
			md += '\n---------\n\n';

			return md;
		}		
	}

	//flomo
	function runFlomo(){
		let appTpl = `<button id="rabbit-hole-btn">导出 flomo 笔记</button>`;

	    let app = document.createElement('div');
	    	app.className = 'rabbit-hole-flomo';
	    app.innerHTML = appTpl;
	    document.body.appendChild(app);

	    let target = document.getElementById('rabbit-hole-btn');
	    target.onclick = function(){
	    	getFlomos(function(notes){
	    		exportFlomoNotes(notes);
	    	});
	    }
	}

	function exportFlomoNotes(notes){
		let md = '# flomo \n\n';

		_.each(notes, function(note){
			md += '\n\n' + removeHTMLTag(note.content) + '\n\n';
			let files = note.files || [];
			if(files.length > 0){
				_.each(files, function(file, index){
					md += '![附件' + file.id + '](' + file.url + ' "") \n\n';
				})
			}

			if(note.tags.length > 0){
				md += '\n标签：';
				_.each(note.tags, function(tag){
					md += ' #' + tag + ' '
				});	
				md += '\n';
			}
			md += '创建：' + note.created_at + '\n';
			md += '更新：' + note.updated_at + '\n';
			md += '来源：' + note.source + '\n';
			md += '\n---------\n\n'
		});

		let zkCard = CRS.dateFormat(new Date(), 'yyyyMMddhhmm');
		let fileName = 'flomo-' + zkCard + '.md';
		let file = new File([ md ], fileName, { "type" : "text\/plain" });
	    let objectUrl = URL.createObjectURL(file);
		
		download(objectUrl, fileName);
	}

	//https://flomoapp.com/api/memo/?tag=&tz=8:0
	function getFlomos(callback){
		var offset = 0;
		var size = 50;
		var result = [];

		let t = setInterval(function(){
			getFlomo(offset, function(memos){
				result = result.concat(memos);
				if(memos.length < 50){
					clearInterval(t);
					callback(result);
				}
			});
			offset += 50;
		}, 200);

		function getFlomo(offset, _callback){
			requestBridge({
		    	api: 'flomo.notes',
		    	type: 'request',
		    	data: {
		    		offset: offset
		    	}
		    }, function(res){
		    	_callback(res.memos);
		    });
		}
	}

	//weibo
	function runWeibo(){
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
					str += '\n[[' + user.screen_name + ']] ' + user.location + ', 主页： https://weibo.com/' + user.profile_url;
				})
			}
			return str;
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

	function download(objectUrl, fileName) {
	    const tmpLink = document.createElement("a");
	    tmpLink.href = objectUrl;
	    tmpLink.download = fileName;
	    document.body.appendChild(tmpLink);
	    tmpLink.click();

	    document.body.removeChild(tmpLink);
	    URL.revokeObjectURL(objectUrl);
	}

	function removeHTMLTag(str) {
	    str = str.replace(/<\/?[^>]*>/g,''); //去除HTML tag
	    // str = str.replace(/[ | ]*\n/g,'\n'); //去除行尾空白
	    //str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
	    str = str.replace(/&nbsp;/ig,' '); //去掉&nbsp;
	    return str;
	}

	function requestBridge(data, callback){
	    //发送创建请求, 此 API 为 2.0
	    // console.log(chrome.extension.sendRequest, 'chrome.extension.sendRequest');
	    chrome.extension.sendRequest(data, function(response) {
	        callback(response);
	    });
	}
})();