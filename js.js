var N8_Chat = function(output, form) {
	this.color = Math.floor(Math.random() * N8_Chat.colors.length);
	this.output = output;

	form.addEventListener('submit', function (e){
		if (e.preventDefault) e.preventDefault();

		if (form.name.value == '') return this.add_msg('Enter your Name please!');
		if (form.message.value == '') return this.add_msg('Enter a message please!');

		this.websocket.send(JSON.stringify({
			message: form.message.value,
			name: form.name.value,
			color: N8_Chat.colors[this.color],
			date: Date.now()
		}));

		form.message.value = ''; //reset text
		return false;
	}.bind(this));

	this.connect();
};

// List of chat users colors
N8_Chat.colors = ['007AFF','FF7000','FF7000','15E25F','CFC700','CFC700','CF1100','CF00BE','F00'];

// Message parsing
N8_Chat.process_msg = function (msg) {
	// http://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
	var regex = /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*))/;

	msg = msg.replace(regex, function (rep) {
		return '<a href="' + rep + '" target="_blank">' + rep + '</a>';
	});
	return msg;
};

// Chatting message
N8_Chat.prototype.add_msg = function(msg, name, time, color) {

	// Cleanup parameters
	if (!msg) return;
	msg = N8_Chat.process_msg(msg);
	name = name ? name : 'System';
	time = time ? time : Date.now();
	time = (new Date(time)).toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'});
	color = color ?  color : N8_Chat.colors[0];

	// check if we can append or have to insert...
	var last = this.output.lastChild;
	if (
		last &&
		last.querySelector('.uname').innerHTML == name &&
		last.querySelector('.time').innerHTML == time
	) { // Append to previous chat row
		last.querySelector('.msg').innerHTML += '<br/>' + msg;
	} else { // Add new chat row

		// Generate HTML
		var html = '<div class="uname" style="color:#' + color + '">' + name + '</div>';
		html += '<div class="msg"><div class="time">' + time + '</div>' + msg + '</div>';

		// output element
		var ele = document.createElement('div');
		ele.innerHTML = html;
		this.output.appendChild(ele);
	}
};

//create a new WebSocket object.
N8_Chat.prototype.connect = function() {
	this.websocket = new WebSocket('ws://localhost:9000/server.php');
	this.websocket.onopen = this.add_msg.bind(this, 'Connected!', undefined, undefined, undefined);

	this.websocket.onclose = function() {
		this.add_msg('Connection Closed', undefined, undefined, undefined);
		setTimeout(this.connect.bind(this), 5000); // re-attempt!
	}.bind(this);

	this.websocket.onerror = function(ev) {
		console.log(ev);
		this.add_msg('Error Occurred - ' + ev.data, undefined, undefined, undefined);
	}.bind(this);

	this.websocket.onmessage = function(ev) {
		var msg = JSON.parse(ev.data); // PHP sends Json data

		switch (msg.type) {
			case 'usermsg': this.add_msg(msg.message, msg.name, msg.date, msg.color); break;
			case 'system': this.add_msg(msg.message, undefined, undefined, undefined); break;
		}
	}.bind(this);
};

var chat_room = new N8_Chat( document.getElementById('message_box'), document.chat );