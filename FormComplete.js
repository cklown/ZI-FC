(function() {
	
	/** Configurations
	 *  
	 *   dynamic
	 *     boolean; if true, we will observe the formContainer element and wait for the form to be created. Not needed if form exist in DOM at load.
	 *  
	 *   formSelector
	 *     query selector value, example #FormID, .FormClass, Form[Attribute=Value]; This is used to locate the form within a document.
	 *  
	 *   formContainer
	 *     query selector value, example #FormContainerID, .FormContainerClass, FormContainer[Attribute=Value]; This is used to locate the form container within a document. This is only needed if 'dynamic' is true. Default value: body.
	 *  
	 *   excludedFields
	 *     text value(s); specify 1 or more fields to exclude from form shortenting logic. By default all input and select fields except for email will be hidden, and all hidden fields that are not populated on email match will be unhidden.
	 *   
	 */
	const configurations = {
		dynamic: false,  // set to true if form does not exist imediatly in document.
		formSelector: '#example1',
		formContainer: 'body',
		excludedFields: ['name2', 'notreal']  // id, name or class
	}
	
	// Project key. Get this value from FormComplete.
	window.ZIProjectKey = "0281657f921669107410"; 


	// Form Class.
	class ZI_Form {
		
		constructor( data, configurations ) {
			
			console.log('ZI - Constructing form object...', data);
			
			// Store configurations.
			this.configurations = configurations;

			// Store context where form resides. This searches sourceless iframes as well.
			this.context = this.getContext(data.formSelector);
			
			// Dynamic enabled?
			if (this.configurations['dynamic']) {
				
				// Define Mutation Observer 
				const formWatch = function(mutationsList, observer) {
					for(const mutation of mutationsList) {
						if (mutation.type === 'childList') {
							for (const e of mutation.addedNodes) {
								if (e.tagName.toLowerCase() === 'form') {
									
									console.log('ZI - Form added to ' + this.configurations['formContainer'] + '.');

									// Maybe check here... data.formSelector == e.id || ...
									this.readyForm(data);
									
									// Stop observer.
									observer.disconnect();

								}
							}
						}
					}
				};
				
				const watchContainer = this.context.querySelector(this.configurations['formContainer']);// using form context... hope things play nice...
				if ( watchContainer !== null ) {

					// Create observer instance linked to formWatch callback
					const observer = new MutationObserver(formWatch);

					// Start observing formContainer for mutations.
					observer.observe( watchContainer, {childList:true} );

				} else {

					console.log('ZI - Form container ('+ this.configurations['formContainer'] +') not found. Recommended default: body');

				}

			} else {
			
				// Ready form.
				this.readyForm(data);
			
			}

		}

		// Get context for form.
		getContext(selector) {
			
			var iframes = document.getElementsByClassName('hs-form-iframe');
			if(iframes) {
				for( var i=0; i < iframes.length; i+=1 ) {
					if( iframes[i].contentDocument.querySelector(selector) )
						return iframes[i].contentDocument;
				}
			}
			
			return document;
			
		}

		// Ready form when form is loaded.
		readyForm(data) {
			
			console.log('ZI - Readying form...');
			data.inputs.forEach(function(input){this.readyField(context.querySelector(data.formSelector+' '+input));});
			document.getElementById('ZI_AF').remove();// Remove Antiflicker style.
			
		}
		
		// Update form when a match is found by ZI API.
		updateForm(data) {
			
			console.log('ZI - Updating form...');
			data.inputs.forEach(function(input){this.updateField( context.querySelector(data.formSelector+' '+input), input, data );});
			
		}

		// Hide mapped field that is not email nor an excluded field in configurations.
		readyField(field) {
			
			// Analyze field.
			const isField = ['INPUT', 'SELECT'].includes(field.nodeName);
			const ignoredType = field.hasAttribute('type') && [ 'reset', 'button', 'submit', 'hidden', 'radio' ].includes(field.getAttribute('type').toLowerCase());//! should radio be excluded?
			const isEmail = ['id', 'name', 'class'].some(identifier => field[identifier] && field[identifier].includes('email') || field.classList.contains('email'));
			const isExcluded = excludedFields.includes(field.id) || excludedFields.includes(field.name) || field.classList.contains(excludedFields);

			if (isField && !ignoredType && !isEmail && !isExcluded) {
				const fieldContainer = findContainer(field);
				if (fieldContainer) {fieldContainer.style.display = 'none';}
				else {console.log('ZI - Field Container not found.', field);}
			}
			
		}
		
		// Update mapped field that is not email nor an excluded field in configurations. If an element is hidden by end-user and is excluded, we will not unhide element spite it being hidden + unpopulated with data, end-user will need to unhide with their own logic if excluded. 
		updateField( field, input, data ) {
			
			// If field populated, ignore.
			if ( data[input] != undefined ) {return;}

			// Find field container.
			const fieldContainer = findContainer(field);
			if (!fieldContainer) {
				console.log('ZI - Field Container not found.', field);
				return;
			}

			// If field is displayed, ignore.
			if ( fieldContainer.style.display != 'none' ){return;}

			// Analyze field.
			const isField = ['INPUT', 'SELECT'].includes(field.nodeName);
			const ignoredType = field.hasAttribute('type') && [ 'reset', 'button', 'submit', 'hidden', 'radio' ].includes(field.getAttribute('type').toLowerCase());//! should radio be excluded?
			const isExcluded = excludedFields.includes(field.id) || excludedFields.includes(field.name) || field.classList.contains(excludedFields);

			// Field was not populated and is not excluded, display it.
			if ( isField && !ignoredType && !isExcluded ) {fieldContainer.style.display = '';}

		}
		
	}

    // Ensure fc variable is initialized.
    if(!window._zi_fc){window._zi_fc = {};}
	
	// Initialize when ready.
	window._zi_fc.onReady = function( data, configurations ) {
		ZI_Form = new ZI_Form( data, configurations );
		ZI_Forms.readyForm();
	}
	
	// Listen for ZI API matches.
	window._zi_fc.onMatch = function(data) {
		ZI_Forms.updateForm();
	}

	// Antiflicker.
	// !!! At present, this only applies in the doc, not inside iframes.
	const s = document.createElement('style');
	s.id = 'ZI_AF';
	s.innerHTML = `${configurations['formSelector']} {opacity:0 !important;}`;// The CSS to be loaded which dynamically will populate the form selector.
	document.head.appendChild(s);
	
	// Add base logic once document has loaded.
	document.addEventListener('DOMContentLoaded', function() {

		var zi = document.createElement('script');
		(zi.type = 'text/javascript'),
		(zi.async = true),
		(zi.src = 'https://js.zi-scripts.com/zi-tag.js'),
		document.readyState === 'complete'?
		document.body.appendChild(zi):
		window.addEventListener('load', function(){document.body.appendChild(zi)});
	
	}, { once:true, capture:true });
	
	console.log('ZI - FormComplete snippet loaded.');
	
})();