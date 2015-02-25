console.log('page webmm', WebMM);
setTimeout(function(){
	document.dispatchEvent(new CustomEvent('wesecure_load', {
		detail: WebMM
	}));
}, 0);
