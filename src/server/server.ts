
import * as express from 'express';
import http = require('http');
import sio = require('socket.io');
import path = require('path');
import _model = require('../common/simpleModel');
import int = require('../common/int');
import {IModel, IModelListener} from '../common/model';

var app = express();
app.use(express.static(path.join(__dirname, '../../public')));

var server = http.createServer(app);
var io = sio.listen(server);

server.listen(process.env.PORT || 8000);


var modelsMap: { [gameId: string]: _model.SimpleModel; } = {};

io.sockets.on('connection', function (socket) {

	var send = (event: int.IServerEvent) => {
		socket.send(event);
	};

	var model: _model.SimpleModel = null;

	var modelListener: IModelListener = {
		onChanged: (model: IModel) => {
			send({
				type: int.ServerEventType.ModelChanged,
				data: (<_model.SimpleModel>model).serialize()
			});
		}
	};

	function getOrCreateModel(gameId: string): _model.SimpleModel {
		var r = modelsMap[gameId];

		if (!r) {
			r = new _model.SimpleModel(4);
			modelsMap[gameId] = r;
		}

		return r;
	}

	function init(gameId: string): void {
		if (model) {
			model.removeListener(modelListener);
			model = null;
		}

		model = getOrCreateModel(gameId);
		model.addListener(modelListener);
	}
	function reset(gameId: string): void {
		model = getOrCreateModel(gameId);
		model.reset();
	}
	function up(gameId: string): void {
		getOrCreateModel(gameId).up();
	}
	function down(gameId: string): void {
		getOrCreateModel(gameId).down();
	}
	function left(gameId: string): void {
		getOrCreateModel(gameId).left();
	}
	function right(gameId: string): void {
		getOrCreateModel(gameId).right();
	}

	console.log('server got connection');
	socket.on('message', function (msg: int.IClientEvent) {
		switch (msg.type) {
			case int.ClientEventType.Init:
				init(msg.data);
				break;
			case int.ClientEventType.Reset:
				reset(msg.data);
				break;
			case int.ClientEventType.Up:
				up(msg.data);
				break;
			case int.ClientEventType.Down:
				down(msg.data);
				break;
			case int.ClientEventType.Left:
				left(msg.data);
				break;
			case int.ClientEventType.Right:
				right(msg.data);
				break;
		}
	});

	socket.on('disconnect', function () {
		if (model) {
			model.removeListener(modelListener);
			model = null;
		}
	});
});