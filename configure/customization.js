// Add customization functionality
function setupCustomizationListeners() {
    // Get all customization elements
    const hideAlbumArtCheckbox = document.getElementById('hideAlbumArt');
    const bgColorPicker = document.getElementById('bgColor');
    const bgOpacitySlider = document.getElementById('bgOpacity');
    const textColorPicker = document.getElementById('textColor');
    const visibilityDurationInput = document.getElementById('visibilityDuration');
    
    // Add event listeners to update URL when options change
    hideAlbumArtCheckbox.addEventListener('change', () => {
        updateBrowserSourceURL();
        updatePreview();
    });
    
    bgColorPicker.addEventListener('input', () => {
        updateBrowserSourceURL();
        updatePreview();
    });
    
    bgOpacitySlider.addEventListener('input', () => {
        updateBrowserSourceURL();
        updatePreview();
    });
    
    textColorPicker.addEventListener('input', () => {
        updateBrowserSourceURL();
        updatePreview();
    });
    
    visibilityDurationInput.addEventListener('input', updateBrowserSourceURL);
    
    // Initialize preview
    createPreview();
    updatePreview();
}

function updateBrowserSourceURL() {
    const client_id = localStorage.getItem("client_id");
    const client_secret = localStorage.getItem("client_secret");
    
    // Start with the base URL and required parameters
    let url = `${baseURL}?client_id=${client_id}&client_secret=${client_secret}&refresh_token=${refresh_token}`;
    
    // Add customization options if they're set
    const hideAlbumArt = document.getElementById('hideAlbumArt').checked;
    const bgColor = document.getElementById('bgColor').value;
    const bgOpacity = document.getElementById('bgOpacity').value;
    const textColor = document.getElementById('textColor').value;
    const visibilityDuration = document.getElementById('visibilityDuration').value;
    
    // Only add parameters that are different from defaults
    if (hideAlbumArt) {
        url += '&hideAlbumArt=true';
    }
    
    // Convert hex color to RGB and add with opacity
    if (bgColor !== '#000000' || bgOpacity !== '0.5') {
        // Remove the # from hex color
        const hexColor = bgColor.substring(1);
        // Convert hex to RGB
        const r = parseInt(hexColor.substring(0, 2), 16);
        const g = parseInt(hexColor.substring(2, 4), 16);
        const b = parseInt(hexColor.substring(4, 6), 16);
        url += `&bgColor=${r},${g},${b},${bgOpacity}`;
    }
    
    if (textColor !== '#ffffff') {
        // Remove the # from hex color
        const hexColor = textColor.substring(1);
        // Convert hex to RGB
        const r = parseInt(hexColor.substring(0, 2), 16);
        const g = parseInt(hexColor.substring(2, 4), 16);
        const b = parseInt(hexColor.substring(4, 6), 16);
        url += `&textColor=${r},${g},${b}`;
    }
    
    if (visibilityDuration !== '0' && visibilityDuration > 0) {
        url += `&duration=${visibilityDuration}`;
    }
      // Update the global URL
    browserSourceURL = url;
    
    // Update the copy button if it's visible
    const copyButton = document.getElementById('copyURLButton');
    if (copyButton && window.getComputedStyle(copyButton).display !== 'none') {
        copyButton.innerText = "Click to copy URL";
        copyButton.style.backgroundColor = "#ffffff";
        copyButton.style.color = "#181818";
    }
}

// Create a preview of the widget in the customization options section
function createPreview() {
    const previewContainer = document.createElement('div');
    previewContainer.id = 'widgetPreview';
    previewContainer.className = 'widget-preview';
    
    previewContainer.innerHTML = `
        <h4>Preview</h4>
        <div class="preview-container">
            <div class="preview-widget">
                <div class="preview-album-art"></div>
                <div class="preview-info">
                    <div class="preview-song">Song Title</div>
                    <div class="preview-artist">Artist Name</div>
                    <div class="preview-progress-bg">
                        <div class="preview-progress-bar"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const customizationOptions = document.getElementById('customizationOptions');
    customizationOptions.appendChild(previewContainer);
    
    // Add CSS for the preview
    const style = document.createElement('style');
    style.textContent = `
        .widget-preview h4 {
            margin: 20px 0 10px 0;
            color: #1DB954;
        }
        
        .preview-container {
            background: #111;
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 15px;
        }
        
        .preview-widget {
            display: flex;
            align-items: center;
            height: 70px;
        }
        
        .preview-album-art {
            width: 70px;
            height: 70px;
            background: url('../images/placeholder-album-art.png');
            background-size: cover;
            border-radius: 5px;
            margin-right: 10px;
        }
        
        .preview-info {
            flex: 1;
            padding: 5px 10px;
            border-radius: 5px;
            height: 60px;
            position: relative;
        }
        
        .preview-song {
            font-weight: bold;
            font-size: 16px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .preview-artist {
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            opacity: 0.8;
        }
        
        .preview-progress-bg {
            margin-top: 10px;
            background: #1F1F1F;
            height: 4px;
            border-radius: 2px;
        }
        
        .preview-progress-bar {
            width: 30%;
            height: 100%;
            border-radius: 2px;
        }
    `;
    document.head.appendChild(style);
}

// Update the preview based on current settings
function updatePreview() {
    const hideAlbumArt = document.getElementById('hideAlbumArt').checked;
    const bgColor = document.getElementById('bgColor').value;
    const bgOpacity = document.getElementById('bgOpacity').value;
    const textColor = document.getElementById('textColor').value;
    
    // Convert hex to rgba
    const bgHex = bgColor.substring(1);
    const bgR = parseInt(bgHex.substring(0, 2), 16);
    const bgG = parseInt(bgHex.substring(2, 4), 16);
    const bgB = parseInt(bgHex.substring(4, 6), 16);
    
    const textHex = textColor.substring(1);
    const textR = parseInt(textHex.substring(0, 2), 16);
    const textG = parseInt(textHex.substring(2, 4), 16);
    const textB = parseInt(textHex.substring(4, 6), 16);
    
    // Update the preview elements
    const previewAlbumArt = document.querySelector('.preview-album-art');
    const previewInfo = document.querySelector('.preview-info');
    const previewSong = document.querySelector('.preview-song');
    const previewArtist = document.querySelector('.preview-artist');
    const previewProgressBar = document.querySelector('.preview-progress-bar');
    
    // Apply styles
    if (hideAlbumArt) {
        previewAlbumArt.style.display = 'none';
        previewInfo.style.width = 'calc(100% - 20px)';
    } else {
        previewAlbumArt.style.display = 'block';
        previewInfo.style.width = '';
    }
    
    previewInfo.style.backgroundColor = `rgba(${bgR}, ${bgG}, ${bgB}, ${bgOpacity})`;
    previewSong.style.color = `rgb(${textR}, ${textG}, ${textB})`;
    previewArtist.style.color = `rgb(${textR}, ${textG}, ${textB})`;
    previewProgressBar.style.backgroundColor = `rgb(${textR}, ${textG}, ${textB})`;
}
