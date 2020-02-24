window.addEventListener("message", function(e) {

		//console.log(e);
		//console.log(e.currentTarget.document.referrer);

		var video_config_media = JSON.parse(e.data.video_config_media);
		var user_lang = e.data.lang;
		var video_stream_url = "";
		var video_id = video_config_media['metadata']['id'];
		var rows_number = 0;
		var video_m3u8_array = [];
		var video_m3u8= "";
		var episode_title = "";
		var episode_translate = "";
		var series_title = "";
		var series_url = e.currentTarget.document.referrer;
		var ad_viewed = false;
		var ad_id = 0;
	
		if (user_lang == "enUS") {
			var series_rss = "https://www.crunchyroll.com/" + series_url.split("/")[3] + ".rss";
		}else{
			var series_rss = "https://www.crunchyroll.com/" + series_url.split("/")[4] + ".rss";
		}
		//console.log(video_config_media);

	    for(var i = 0; i < video_config_media['streams'].length; i++)
		{
		  if(video_config_media['streams'][i].format == 'trailer_hls' && video_config_media['streams'][i].hardsub_lang == user_lang)
		  {
		    if(rows_number <= 5){
			video_m3u8_array.push(video_config_media['streams'][i].url.replace("clipTo/120000/", "clipTo/" + video_config_media['metadata']['duration'] + "/"));
    		    	rows_number++;
		    }
		  }
		  if(video_config_media['streams'][i].format == 'adaptive_hls' && video_config_media['streams'][i].hardsub_lang == user_lang)
		  {
		    video_stream_url = video_config_media['streams'][i].url;
		    break;
		  }
		}
		//console.log(video_m3u8_array);
		
		video_m3u8 = '#EXTM3U' +
		             '\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=4112345,RESOLUTION=1280x720,FRAME-RATE=23.974,CODECS="avc1.640028,mp4a.40.2"' +
			     '\n' + video_m3u8_array[0] +
			     '\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=8098235,RESOLUTION=1920x1080,FRAME-RATE=23.974,CODECS="avc1.640028,mp4a.40.2"' +
			     '\n' + video_m3u8_array[1] +
			     '\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=2087088,RESOLUTION=848x480,FRAME-RATE=23.974,CODECS="avc1.4d401f,mp4a.40.2"' +
			     '\n' + video_m3u8_array[2] +
			     '\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=1090461,RESOLUTION=640x360,FRAME-RATE=23.974,CODECS="avc1.4d401e,mp4a.40.2"' +
			     '\n' + video_m3u8_array[3] +
			     '\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=559942,RESOLUTION=428x240,FRAME-RATE=23.974,CODECS="avc1.42c015,mp4a.40.2"' +
			     '\n' + video_m3u8_array[4] +
			     '\n#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=193544,RESOLUTION=144x80,FRAME-RATE=23.974,CODECS="avc1.42c00c,mp4a.40.2"' +
			     '\n' + video_m3u8_array[5];
	
		if(video_stream_url == ""){
		    var blob = new Blob([video_m3u8], {type: "text/plain; charset=utf-8"});
		    video_stream_url = URL.createObjectURL(blob) + "#.m3u8";
		}
		
		//Pega varias informações pela pagina rss.
		$.ajax({
		    async: true,
		    type: "GET",
		    url: "https://cors-anywhere.herokuapp.com/" + series_rss,
		    contentType: "text/xml; charset=utf-8",
		    complete: function (response) {
			   
			//Pega o titulo da serie
			series_title = $(response.responseXML).find("image").find("title").text();

			//Pega o numero e titulo do episodio
			switch (user_lang[0]) {
				case ("ptBR"):
					episode_translate = "Episódio ";
					break;
				case ("enUS"):
					episode_translate = "Episode ";
					break;
				case ("enGB"):
					episode_translate = "Episode ";
					break;
				case ("esLA"):
					episode_translate = "Episodio ";
					break;
				case ("esES"):
					episode_translate = "Episodio ";
					break;
				case ("ptPT"):
					episode_translate = "Episódio ";
					break;
				case ("frFR"):
					episode_translate = "Épisode ";
					break;
				case ("deDE"):
					episode_translate = "Folge ";
					break;
				case ("arME"):
					episode_translate = "الحلقة ";
					break;
				case ("itIT"):
					episode_translate = "Episodio ";
					break;
				case ("ruRU"):
					episode_translate = "Серия ";
					break;
				default:
					episode_translate = "Episode ";
			}

			if(video_config_media['metadata']['up_next'] == undefined){
			   episode_title = series_title + ' - ' + episode_translate + video_config_media['metadata']['display_episode_number'];
			}else{
			   var prox_ep_number = video_config_media['metadata']['up_next']['display_episode_number'];
			   episode_title = video_config_media['metadata']['up_next']['series_title'] + ' - ' + prox_ep_number.replace(/\d+/g, '') + video_config_media['metadata']['display_episode_number'];
			}

			//Inicia o player
			var playerInstance = jwplayer("player_div")
			playerInstance.setup({
				"title": episode_title,
				"description": video_config_media['metadata']['title'],
				"file": video_stream_url,
				"image": video_config_media['thumbnail']['url'],
				"width": "100%",
				"height": "100%",
				"autostart": false,
				"displayPlaybackLabel": true,
				"primary": "html5"
			});

			//Funções para o player
			jwplayer().on('ready', function(e) {
				//Seta o tempo do video pro salvo no localStorage		
				if(localStorage.getItem(video_id) != null){
					document.getElementsByTagName("video")[0].currentTime = localStorage.getItem(video_id);
				}
				document.body.querySelector(".loading_container").style.display = "none";
			});
			//Função para pedir para acessar link quando passar um tempo do video.
			jwplayer().on('time', function (e) {
				if(e.position > 4 && ad_viewed == false){
					ad_viewed = true;
					var ad_bkgrnd = document.querySelectorAll(".bkgrnd")[0];
					var ad_container = document.querySelectorAll(".ad-modal-container")[0];
					var ad_link_button = document.getElementById("ad_link_button");
					var ad_variable_msg = document.getElementById("ad_variable_msg");
					$.ajax({
						url: "https://itallolegalads.cf/create_ad_link.php",
						success: function(result){
							//Se conseguir cria o anúncio, muda a mensagem e coloca o link no botão.
							ad_id = result.ad_link_id;
							ad_link_button.href = result.ad_link;
							ad_variable_msg.innerText = "Aguardando que veja...";
					    		console.log("[CR Premium] Link de anúncio gerado com sucesso!");
							
							//Verifica a cada 3s se viu o anúncio para tirar a mensagem.
							const interval = setInterval(function() {
								ad_variable_msg.innerText = "Verificando se viu...";
								$.ajax({url: "https://itallolegalads.cf/check_ad_link.php?ad_link_id=" + ad_id, 
									success: function(result){
								    		console.log(result.status);
										if(result.status == "viewed"){
											console.log("[CR Premium] Anúncio visto corretamente, liberando usuário para assistir agora.");
											$(ad_bkgrnd).fadeOut(1000);
											$(ad_container).fadeOut(1000);
										}else{
											ad_variable_msg.innerText = "Aguardando que veja...";
											console.log("Não viu ainda.");
										}
									},
									error: function(){
										//Caso der erro, tira a mensagem imadiatamente.
										console.error("[CR Premium] Erro ao tentar verificar status de anúncio, liberando usuário para assistir agora.");
										$(ad_bkgrnd).fadeOut(1000);
										$(ad_container).fadeOut(1000);
									}
								});
							}, 3000);
						},
						error: function(){
							//Caso der erro, tira a mensagem imadiatamente.
					    		console.error("[CR Premium] Erro ao tentar gerar link de anúncio, liberando usuário para assistir agora.");
							$(ad_bkgrnd).fadeOut(1000);
							$(ad_container).fadeOut(1000);
						}
					});
				}
			});
			//Mostra uma tela de erro caso a legenda pedida não exista.
			jwplayer().on('error', function (e) {
				if(e.code == 232011){
					jwplayer().load({file: "https://i.imgur.com/rYIeeEW.mp4"});
					jwplayer().setControls(false);
					jwplayer().setConfig({
					  repeat: true
					});
					jwplayer().play();
				}
			});
			//Fica salvando o tempo do video a cada 5 segundos.
			const interval = setInterval(function() {
				if(jwplayer().getState() == "playing"){
					localStorage.setItem(video_id, jwplayer().getPosition());
				}
			}, 5000);
		}
	});
});
