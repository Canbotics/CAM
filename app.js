var express = require('express');
var mysql = require('mysql');
var app = express();

var dbCam = mysql.createConnection({host:process.env.DBCAM.split('|')[0],user:process.env.DBCAM.split('|')[1],password:process.env.DBCAM.split('|')[2],database:process.env.DBCAM.split('|')[3]});

dbCam.connect(function(err) {
	if (err) {
		console.error('Canbotics Asset Manager failed to connect to DBCAM :');
		console.error(err.stack);
		console.error("=====");
		return;
	}
	console.log('Canbotics Asset Manager has connected to DBCAM as id : ' + dbCam.threadId);
});

app.use(express.static(__dirname + '/public'));

app.set('port',(process.env.PORT || 5000));
app.set('views',__dirname + '/pages');
app.set('view engine', 'ejs');

var dataSite = {
	uri:{
		rootSite:'http://cam.canbotics.ca',
		rootAsset:'http://asset.canbotics.ca/cam/',
		rootAssetGlobal:'http://asset.canbotics.ca/global/',
		camImageStore:'http://cam.canbotics.xyz/'
	},
	title:{
		en:'Canbotics Asset Manager',
		fr:'Gestionnaire d\'actifs Canbotics'
	}
};

var dataPage = {
	root:{
		en:'View a list of the domains you have access to, inside the ' + dataSite.title.en + '.',
		fr:'Affichez la liste des domaines auxquels vous avez accès, dans le ' + dataSite.title.fr + '.'
	},
	index:{
		en:'Your dashboard, of [DOMAIN] inside ' + dataSite.title.en + '.',
		fr:'Votre tableau de bord, de [DOMAIN] à l\'intérieur de ' + dataSite.title.fr + '.'
	},
	asset:{
		en:'',
		fr:''
	},
	image:{
		en:'',
		fr:''
	},
	domain:{
		en:'',
		fr:''
	}
};










/* =================================== BASE PAGES */
/* ============================================== */
/* ============================================== INDEX */
app.get('/:langCode(en|fr|)',function(request,response) {
	var detailPage = {lang:request.params.langCode,title:'',template:'root',uri:{},canon:{},meta:{},nav:{},disc:[]};

	var detailDomain = {id:0,code:'',uri:'',listDomain:[]};
	
	if (detailPage.lang != 'fr') {
		detailPage.lang = 'en';
	};
	
	detailPage.uri.en =  "/en";
	detailPage.uri.fr =  "/fr";
	detailPage.canon.en = detailPage.canon.fr =  "";
	
	detailPage.title = "Home";
	detailPage.meta.title = dataSite.title[detailPage.lang];
	detailPage.nav = {segment:'root',domain:'',page:''};
	detailPage.meta.desc = dataPage[detailPage.nav.segment][detailPage.lang];

	dbCam.query('SELECT domain_code, domain_title, domain_uri FROM lib_domain INNER JOIN lib_domain_lang ON lib_domain.domain_id = lib_domain_lang.domain_id AND lib_domain_lang.domain_lang = ? ORDER BY domain_title',[detailPage.lang], function (error, results, fields) {
		if (error) throw error;
		
		results.forEach(function(rsListDomain){
			detailDomain.listDomain.push({code:rsListDomain.domain_code,title:rsListDomain.domain_title,uri:rsListDomain.domain_uri})
		});

		response.render('template',{dataSite:dataSite,detailPage:detailPage,detailDomain:detailDomain});
	});
});

app.get('/:langCode(en|fr)/:uriDomain([a-z0-9-]+)',function(request,response) {
	var detailPage = {lang:request.params.langCode,title:'',template:'index',uri:{},canon:{},meta:{},nav:{},disc:[]};

	var detailDomain = {id:'',code:'',listImage:[]};
	
	dbCam.query('SELECT lib_domain.domain_id, domain_name, domain_code, lib_domain_lang.domain_lang, lib_domain_lang.domain_title, lib_domain_lang.domain_uri FROM lib_domain INNER JOIN lib_domain_lang ON lib_domain.domain_id = lib_domain_lang.domain_id INNER JOIN lib_domain_lang AS xref_domain_lang ON lib_domain.domain_id = xref_domain_lang.domain_id AND xref_domain_lang.domain_uri = ?',[request.params.uriDomain], function (error, results, fields) {
		if (error) throw error;
		
		if (results.length) {
			results.forEach(function(rsDetailPage){
				if (rsDetailPage.domain_lang == detailPage.lang) {
					detailPage.title = rsDetailPage.domain_title;
					detailPage.meta.title = rsDetailPage.domain_title + " | " + dataSite.title[rsDetailPage.domain_lang];
					detailPage.nav = {segment:'index',domain:rsDetailPage.domain_code,page:''};
					detailPage.meta.desc = dataPage[detailPage.nav.segment][rsDetailPage.domain_lang];

					detailDomain.id = rsDetailPage.domain_id;
					detailDomain.code = rsDetailPage.domain_code;
					detailDomain.uri = rsDetailPage.domain_uri;
				}
				detailPage.uri[rsDetailPage.domain_lang] =  "/" + rsDetailPage.domain_uri;
				detailPage.canon[rsDetailPage.domain_lang] =  "/" + rsDetailPage.domain_uri;
			});
		} else {
			console.log("nope")
		};

		response.render('template',{dataSite:dataSite,detailPage:detailPage,detailDomain:detailDomain});
	});
});

app.get('/:langCode(en|fr)/:uriDomain([a-z0-9-]+)/:imagePage(image)',function(request,response) {
	var detailPage = {lang:request.params.langCode,title:'',template:'image',uri:{},canon:{},meta:{},nav:{},disc:[]};

	var detailDomain = {id:'',code:'',listImage:[]};
	
	dbCam.query('SELECT lib_domain.domain_id, domain_name, domain_code, lib_domain_lang.domain_lang, lib_domain_lang.domain_title, lib_domain_lang.domain_uri FROM lib_domain INNER JOIN lib_domain_lang ON lib_domain.domain_id = lib_domain_lang.domain_id INNER JOIN lib_domain_lang AS xref_domain_lang ON lib_domain.domain_id = xref_domain_lang.domain_id AND xref_domain_lang.domain_uri = ?',[request.params.uriDomain], function (error, results, fields) {
		if (error) throw error;
		
		if (results.length) {
			results.forEach(function(rsDetailPage){
				if (rsDetailPage.domain_lang == detailPage.lang) {
					if (detailPage.lang == "en") {
						detailPage.title = rsDetailPage.domain_title + " Images";
					} else {
						detailPage.title = "Images " + rsDetailPage.domain_title;
					};
					detailPage.meta.title = "Images | " + rsDetailPage.domain_title + " | " + dataSite.title[rsDetailPage.domain_lang];
					detailPage.nav = {segment:'image',domain:rsDetailPage.domain_code,page:''};
					detailPage.meta.desc = dataPage[detailPage.nav.segment][rsDetailPage.domain_lang];

					detailDomain.id = rsDetailPage.domain_id;
					detailDomain.code = rsDetailPage.domain_code;
					detailDomain.uri = rsDetailPage.domain_uri;
				}
				detailPage.uri[rsDetailPage.domain_lang] =  "/" + rsDetailPage.domain_uri + "/image";
				detailPage.canon[rsDetailPage.domain_lang] =  "/" + rsDetailPage.domain_uri + "/image";
			});
		} else {
			console.log("nope")
		};

		dbCam.query('SELECT img_md5, img_ext, img_width, img_height, img_size, img_upload, tag_class, tag_name FROM lib_img LEFT JOIN xref_img_tag ON lib_img.img_id = xref_img_tag.img_id LEFT JOIN lib_tag ON xref_img_tag.tag_id = lib_tag.tag_id WHERE domain_id = ?',[detailDomain.id], function (error, results, fields) {
			if (error) throw error;
			
			results.forEach(function(rsListImage){
				if(!detailDomain.listImage.filter(iImage => (iImage.md5 === rsListImage.img_md5)).length) {
					detailDomain.listImage.push({md5:rsListImage.img_md5,ext:rsListImage.img_ext,width:rsListImage.img_width,height:rsListImage.img_height,size:rsListImage.img_size,upload:rsListImage.img_upload,listTag:[]})
				};

				detailDomain.listImage.filter(iImage => (iImage.md5 === rsListImage.img_md5))[0].listTag.push([rsListImage.tag_class,rsListImage.tag_name])
			});

			response.render('template',{dataSite:dataSite,detailPage:detailPage,detailDomain:detailDomain});
		});
	});
});

app.get('/:langCode(en|fr)/:uriDomain([a-z0-9-]+)/:assetPage(asset|actif)',function(request,response) {
	var detailPage = {lang:request.params.langCode,title:'',template:'index',uri:{},canon:{},meta:{},nav:{},disc:[]};

	var detailDomain = {id:'',code:'',listImage:[]};
	
	dbCam.query('SELECT lib_domain.domain_id, domain_name, domain_code, lib_domain_lang.domain_lang, lib_domain_lang.domain_title, lib_domain_lang.domain_uri FROM lib_domain INNER JOIN lib_domain_lang ON lib_domain.domain_id = lib_domain_lang.domain_id INNER JOIN lib_domain_lang AS xref_domain_lang ON lib_domain.domain_id = xref_domain_lang.domain_id AND xref_domain_lang.domain_uri = ?',[request.params.uriDomain], function (error, results, fields) {
		if (error) throw error;
		
		if (results.length) {
			results.forEach(function(rsDetailPage){
				if (rsDetailPage.domain_lang == detailPage.lang) {
					if (detailPage.lang == "en") {
						detailPage.title = rsDetailPage.domain_title + " Assets";
						detailPage.meta.title = "Images | " + rsDetailPage.domain_title + " | " + dataSite.title[rsDetailPage.domain_lang];
					} else {
						detailPage.title = "Les actifs de " + rsDetailPage.domain_title;
						detailPage.meta.title = "Actif | " + rsDetailPage.domain_title + " | " + dataSite.title[rsDetailPage.domain_lang];
					};
					detailPage.nav = {segment:'asset',domain:rsDetailPage.domain_code,page:''};
					detailPage.meta.desc = dataPage[detailPage.nav.segment][rsDetailPage.domain_lang];

					detailDomain.id = rsDetailPage.domain_id;
					detailDomain.code = rsDetailPage.domain_code;
					detailDomain.uri = rsDetailPage.domain_uri;
				}
				if (rsDetailPage.domain_lang == "en") {
					detailPage.uri[rsDetailPage.domain_lang] =  "/" + rsDetailPage.domain_uri + "/asset";
					detailPage.canon[rsDetailPage.domain_lang] =  "/" + rsDetailPage.domain_uri + "/asset";
				} else {
					detailPage.uri[rsDetailPage.domain_lang] =  "/" + rsDetailPage.domain_uri + "/actif";
					detailPage.canon[rsDetailPage.domain_lang] =  "/" + rsDetailPage.domain_uri + "/actif";
				}
			});
		} else {
			console.log("nope")
		};

		response.render('template',{dataSite:dataSite,detailPage:detailPage,detailDomain:detailDomain});
	});
});


/* ============================== TESTING */
/* ============================================== */


/* ================================== APP */
/* ============================================== */
/* ============================================== APP : REQUEST LISTENER */
app.listen(app.get('port'), function() {
	console.log('Canbotics Smithy is running on port : ', app.get('port'));
});
