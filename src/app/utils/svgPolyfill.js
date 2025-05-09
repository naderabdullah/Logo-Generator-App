// Ensure ImageTracer is loaded before this script runs
// (e.g., via <script src="imagetracer.min.js"></script> or npm import)
import ImageTracer from 'imagetracerjs'; // Import ImageTracer.js

// Define preset options for ImageTracer.js
export const PRESET_OPTIONS = {
    // Default preset with balanced settings
    default: {
        ltres: 1, // Error threshold for straight lines (less = more detail)
        qtres: 1, // Error threshold for quadratic splines (less = more detail)
        pathomit: 8, // Filter out paths smaller than this many pixels
        rightangleenhance: true, // Enhance right angles
        colorsampling: 2, // 0: disabled, 1: random sampling, 2: deterministic sampling
        numberofcolors: 16, // Number of colors to use
        mincolorratio: 0, // Color quantization optimization
        colorquantcycles: 3, // Color quantization cycles
        layering: 0, // 0: sequential, 1: parallel
        strokewidth: 1, // Stroke width for layered rendering (if layering=1)
        linefilter: false, // Enable line filter for linear elements
        scale: 1, // Scaling factor for output
        roundcoords: 1, // Round coordinates to N decimal places
        viewbox: true, // Add viewBox attribute
        desc: false, // Add <desc> element
        lcpr: 0, // Line color precision
        qcpr: 0, // Quadratic curve color precision
        corsenabled: true // Ensure CORS is handled if loading external images
    },

    // Logo preset - optimized for logo conversion
    logo: {
        ltres: 1,
        qtres: 0.5,
        pathomit: 8,
        rightangleenhance: true,
        colorsampling: 2,
        numberofcolors: 32,
        mincolorratio: 0,
        colorquantcycles: 3,
        layering: 0,
        strokewidth: 1,
        linefilter: false,
        scale: 1,
        roundcoords: 1,
        viewbox: true,
        desc: false,
        lcpr: 0,
        qcpr: 0,
        corsenabled: true
    },

    // Icon preset - optimized for simpler images like icons
    icon: {
        ltres: 1,
        qtres: 1,
        pathomit: 4,
        rightangleenhance: true,
        colorsampling: 2,
        numberofcolors: 16,
        mincolorratio: 0,
        colorquantcycles: 3,
        layering: 0,
        strokewidth: 1,
        linefilter: false,
        scale: 1,
        roundcoords: 1,
        viewbox: true,
        desc: false,
        lcpr: 0,
        qcpr: 0,
        corsenabled: true
    },

    // High quality preset - more detail, more colors
    highQuality: {
        ltres: 0.5,
        qtres: 0.5,
        pathomit: 2, // Keep smaller paths
        rightangleenhance: true,
        colorsampling: 2,
        numberofcolors: 64, // More colors
        mincolorratio: 0,
        colorquantcycles: 5, // More quantization cycles
        layering: 0,
        strokewidth: 1,
        linefilter: false,
        scale: 1,
        roundcoords: 2, // Higher precision coordinates
        viewbox: true,
        desc: false,
        lcpr: 0,
        qcpr: 0,
        corsenabled: true
    },

    // *** NEW: Ultra Detail Preset ***
    // Aims for maximum detail, potentially larger file size and longer processing
    ultraDetail: {
        ltres: 0.1,         // Very low error threshold for lines
        qtres: 0.1,         // Very low error threshold for curves
        pathomit: 0,        // Keep all paths, regardless of size
        rightangleenhance: false, // Disable enhancement that might simplify corners
        colorsampling: 2,     // Deterministic sampling
        numberofcolors: 256,  // Maximum practical number of colors
        mincolorratio: 0,
        colorquantcycles: 10, // Many quantization cycles for accuracy
        layering: 0,
        strokewidth: 1,
        linefilter: false,
        scale: 1,
        roundcoords: 4,     // Very high coordinate precision
        viewbox: true,
        desc: false,
        lcpr: 0,
        qcpr: 0,
        corsenabled: true
    }
};

// Main function to trace an image to SVG using ImageTracer.js
export function imageTraceToSVG(imageUrl, options = PRESET_OPTIONS.ultraDetail) {
    // Ensure options include corsenabled for potentially cross-origin images
    const traceOptions = { ...options, corsenabled: true };

    return new Promise((resolve, reject) => {
        // Check if ImageTracer is available
        if (typeof ImageTracer === 'undefined') {
            reject(new Error('ImageTracer.js library is not loaded.'));
            return;
        }

        try {
            // Use ImageTracer's built-in image loading and conversion
            ImageTracer.imageToSVG(
                imageUrl, // URL of the image
                (svgString) => { // Success callback
                    resolve(svgString);
                },
                traceOptions // Pass the selected options
            );
        } catch (err) {
            // Catch potential errors during setup (e.g., invalid options)
            console.error("Error initiating ImageTracer:", err);
            reject(err);
        }

        // Note: ImageTracer handles the image loading, canvas creation,
        // and error handling internally for the image loading part.
        // The promise resolves/rejects based on the callback from imageToSVG.
    });
}

// --- Example Usage ---
/*
async function convertMyImage() {
    const imageUrl = 'path/to/your/image.png'; // Replace with your image URL or path
    try {
        console.log("Starting SVG conversion with ultraDetail settings...");
        const svgOutput = await imageTraceToSVG(imageUrl, PRESET_OPTIONS.ultraDetail);
        console.log("SVG Conversion Successful!");
        // You can now display the SVG, save it, etc.
        // Example: document.getElementById('svg-container').innerHTML = svgOutput;
        console.log(svgOutput.substring(0, 500) + '...'); // Log the first 500 chars
    } catch (error) {
        console.error("SVG Conversion Failed:", error);
    }
}

// Call the example function (e.g., on a button click or page load)
// convertMyImage();
*/
