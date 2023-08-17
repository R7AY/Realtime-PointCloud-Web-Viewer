/**
 * @author Wei Meng / http://about.me/menway
 *
 * Description: A THREE loader for PCD ASCII files (known as the Point Cloud Data File Format).
 *
 *
 * Limitations: ASCII decoding assumes file is UTF-8.
 *
 * Usage:
 *	var loader = new THREE.PCDLoader();
 *	loader.load('./models/pcd/ascii/dolphins.pcd', function (geometry) {
 *
 *		scene.add( new THREE.Mesh( geometry ) );
 *
 *	} );
 */


 THREE.PCDLoader = function ( manager ) {

    this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.PCDLoader.prototype = {

    constructor: THREE.PCDLoader,

    load: function ( url, onLoad, onProgress, onError ) {

        var scope = this;

        var loader = new THREE.XHRLoader( this.manager );
        loader.setCrossOrigin( this.crossOrigin );
        loader.setResponseType( 'arraybuffer' );
        loader.load( url, function ( text ) {

            onLoad( scope.parse( text ) );

        }, onProgress, onError );

    },

    setCrossOrigin: function ( value ) {

        this.crossOrigin = value;

    },

    setUniforms:function(uniforms){
        this.uniforms = uniforms;
    },

    setVertexShader:function(vertexShader){
        this.vertexShader = vertexShader;
    },

    setFragmentShader:function(fragmentShader){
        this.fragmentShader = fragmentShader;
    },

    setTransparent:function(transparent){
        this.transparent = transparent;
    },

    setSizeAttenuation:function(sizeAttenuation){
        this.sizeAttenuation = sizeAttenuation;
    },

    bin2str: function ( buf ) {

        var array_buffer = new Uint8Array( buf );
        var str = '';
        for ( var i = 0; i < buf.byteLength; i ++ ) {

            str += String.fromCharCode( array_buffer[ i ] ); // implicitly assumes little-endian    ????????

        }

        return str;

    },

    isASCII: function( data ) {

        var header = this.parseHeader( this.bin2str( data ) );

        return header.DATA === "ascii";

    },

    parse: function ( data ) {

        if ( data instanceof ArrayBuffer ) {

            return this.isASCII( data )
                ? this.parseASCII( this.bin2str( data ) )
                : this.parseBinary( data );

        } else {

            return this.parseASCII( data );

        }

    },

    parseHeader: function ( data ) {   //?????parse file header

        var patternHeader = /#\s\.PCD([\s\S]*)binary_compressed\s|#\s\.PCD([\s\S]*)binary\s|#\s\.PCD([\s\S]*)ascii\s/;           //regular expression!!!!!
        var headerText = "";
        var headerLength = 0;
        var result = patternHeader.exec( data );
        if ( result !== null ) {

            headerText = result [ 0 ];
            headerLength = result[ 0 ].length;

        }

        var header = {
            FIELDS:[],
            SIZE:[],
            TYPE:[],
            COUNT:[],
            VIEWPOINT:[],
            headerLength: headerLength
        };

        var lines = headerText.split( '\n' );
        var lineType, lineValues;


        for ( var i = 1; i < lines.length; i ++ ) {

            var line = lines[ i ];
            line = line.trim();     //delete " "(空格) at both sides of the string!!!!!
            if ( line === "" ) {

                continue;

            }
            lineValues = line.split( /\s+/ );
            lineType = lineValues.shift();
            line = lineValues.join( " " );

            switch ( lineType ) {

                case "VERSION":

                    header.VERSION = lineValues[ 0 ];   //don't need parseFloat , though we can transform it into float!!!

                    break;

                case "FIELDS":

                    header.FIELDS = lineValues;

                    break;

                case "SIZE":

                    header.SIZE.push(lineValues[0]);
                    header.SIZE.push(lineValues[1]);
                    header.SIZE.push(lineValues[2]);
                    header.SIZE.push(lineValues[3]);

                    break;

                case "TYPE":

                    header.TYPE = lineValues;

                    break;

                case "COUNT":

                    header.COUNT.push(parseInt(lineValues[0]));
                    header.COUNT.push(parseInt(lineValues[1]));
                    header.COUNT.push(parseInt(lineValues[2]));
                    header.COUNT.push(parseInt(lineValues[3]));

                    break;

                case "WIDTH":

                    header.WIDTH = parseInt(lineValues[0]);

                    break;

                case "HEIGHT":

                    header.HEIGHT = parseInt(lineValues[0]);

                    break;

                case "VIEWPOINT":

                    header.VIEWPOINT.push(parseInt(lineValues[0]));
                    header.VIEWPOINT.push(parseInt(lineValues[1]));
                    header.VIEWPOINT.push(parseInt(lineValues[2]));
                    header.VIEWPOINT.push(parseInt(lineValues[3]));
                    header.VIEWPOINT.push(parseInt(lineValues[4]));
                    header.VIEWPOINT.push(parseInt(lineValues[5]));
                    header.VIEWPOINT.push(parseInt(lineValues[6]));

                    break;

                case "POINTS":

                    header.POINTS = parseInt(lineValues[0]);

                    break;

                case "DATA":

                    header.DATA = lineValues[0];    //data coding way  ascii or binary

                    break;

                default:

                    console.log( "unhandled", lineType, lineValues );

            }

        }

        return header;

    },

    parseASCIINumber: function ( n, TYPE ) {

        switch ( TYPE ) {

            case "I":
            case "U":

                return parseInt( n );

            case "F":

                return parseFloat( n );

        }

    },

    parseASCIIElement: function (TYPE,line ) {

        var values = line.split( /\s+/ );

        var element = {
            x:undefined,
            y:undefined,
            z:undefined,
            rgb:undefined
        };
        if(values.length > 1){
            if(TYPE[TYPE.length - 1] == "z"){
                //console.log('\'x y z\' isn\'t supported now!');
                element.x = this.parseASCIINumber(values.shift(),TYPE[0]);
                element.y = this.parseASCIINumber(values.shift(),TYPE[1]);
                element.z = this.parseASCIINumber(values.shift(),TYPE[2]);
                element.rgb = 2210800;
            }
            else if(TYPE[TYPE.length - 1] == "rgb"){     //默认这种情况!!!!!
                element.x = this.parseASCIINumber(values.shift(),TYPE[0]);
                element.y = this.parseASCIINumber(values.shift(),TYPE[1]);
                element.z = this.parseASCIINumber(values.shift(),TYPE[2]);
                element.rgb = this.parseASCIINumber(values.shift(),TYPE[3]);
            }
            else if(TYPE[TYPE.length - 1] == "normal_z"){
                console.log('\'x y z normal_x normal_y normal_z\' isn\'t supported now!');
            }
            else if(TYPE[TYPE.length - 1] == "j3"){    //Maybesomething wrong here!!!!!
                console.log('\'j1 j2 j3\' isn\'t supported now!');
            }
        }
        return element;

    },

    parseASCII: function ( data ) {

        // PLY ascii format specification, as per http://en.wikipedia.org/wiki/PLY_(file_format)

        var geometry = new THREE.Geometry();

        var result;

        var header = this.parseHeader( data );

        var patternBody = /binary_compressed\s([\s\S]*)$/;
        var body = "";
        if ( ( result = patternBody.exec( data ) ) !== null ) {

            body = result [ 1 ];

        }

        var lines = body.split( '\n' );
        geometry.useColor = false;
        geometry.numPoints = header.POINTS;

        for ( var i = 0; i < lines.length; i ++ ) {

            var line = lines[ i ];
            line = line.trim();
            if ( line === "" ) {

                continue;

            }

            var element = this.parseASCIIElement(header.TYPE,line );

            if(!(element === undefined)) this.handleElement( geometry,header.FIELDS,element );

        }

        return this.postProcess( geometry );

    },

    postProcess: function ( geometry ) {     //wihtout faces!!!!  it's OK?????

        //geometry.elementsNeedUpdate = true;

        geometry.computeBoundingSphere();

        return geometry;

    },

    handleElement: function ( geometry, FIELDS,element ) {

        geometry.vertices.push(
            new THREE.Vector3( element.x, element.y, element.z )
        );

        if ( 'rgb' in FIELDS ) {
            console.log('something wrong?');
            geometry.useColor = true;

            var color = new THREE.Color();
            color.setHex( element.rgb.toString(16));   // decimal to hexadecimal (namely 10m to 16m)
            geometry.colors.push( color );

        }
        else{                                         //rgb is default number
            geometry.useColor = true;

            var color = new THREE.Color();
            color.setHex( element.rgb.toString(16));   // decimal to hexadecimal (namely 10m to 16m)
            geometry.colors.push( color );
            //this.attributes.customColor.value.push(color);
            //this.attributes.size.push(1);
        }

    },

    binaryRead: function ( dataview, at, TYPE, SIZE, little_endian ) {

        switch ( SIZE ) {

            // corespondences for non-specific length types here match rply:
            case "1":
                if(TYPE == "I")
                    return [ dataview.getInt8( at ), 1 ];
                else
                    return [ dataview.getUint8( at ), 1 ];
                break;

            case "2":
                if(TYPE == "I")
                    return [ dataview.getInt16( at, little_endian ), 2 ];
                else
                    return [ dataview.getUint16( at, little_endian ), 2 ];
                break;

            case "4":
                if(TYPE == "I")
                    return [ dataview.getInt32( at, little_endian ), 4 ];
                if(TYPE == "U")
                    return [ dataview.getUint32( at, little_endian ), 4 ];
                if(TYPE == "F")
                    return [ dataview.getFloat32( at, little_endian ), 4 ];
                break;

            case "8":
                return [ dataview.getFloat64( at, little_endian ), 8 ];
                break;

            default:
                console.log('what\'s wrong!!');
        }

    },

    binaryReadElement: function ( dataview, at, Header, little_endian ) {

        var element = {
            x:undefined,
            y:undefined,
            z:undefined,
            rgb:undefined
        };
        var result, read = 0;

        if(Header.FIELDS.toString() == ['x','y','z','rgb'].toString()){

            result = this.binaryRead( dataview, at + read, Header.TYPE[0], Header.SIZE[0], little_endian );
            element.x = result[ 0 ];
            read += result[ 1 ];

            result = this.binaryRead( dataview, at + read, Header.TYPE[1], Header.SIZE[1], little_endian );
            element.y = result[ 0 ];
            read += result[ 1 ];

            result = this.binaryRead( dataview, at + read, Header.TYPE[2], Header.SIZE[2], little_endian );
            element.z = result[ 0 ];
            read += result[ 1 ];

            result = this.binaryRead( dataview, at + read, Header.TYPE[3], Header.SIZE[3], little_endian );
            element.rgb = result[ 0 ];
            read += result[ 1 ];

        }
        else{
            //console.log('Other fields arn\'t supported yet!');
            result = this.binaryRead( dataview, at + read, Header.TYPE[0], Header.SIZE[0], little_endian );
            element.x = result[ 0 ];
            read += result[ 1 ];

            result = this.binaryRead( dataview, at + read, Header.TYPE[1], Header.SIZE[1], little_endian );
            element.y = result[ 0 ];
            read += result[ 1 ];

            result = this.binaryRead( dataview, at + read, Header.TYPE[2], Header.SIZE[2], little_endian );
            element.z = result[ 0 ];
            read += result[ 1 ];

            element.rgb = 2210800;

        }

        return [ element, read ];

    },

    parseBinary: function ( data ) {

        var geometry = new THREE.BufferGeometry();
        geometry.useColor = false;

        var header = this.parseHeader( this.bin2str( data ) );
        geometry.numPoints = header.POINTS;
        var little_endian = ( header.DATA === "binary_compressed" || header.DATA === "binary"  );
        //if(little_endian)  console.log("Compressed binary file is not supported yet!!!");
        var body = new DataView( data, header.headerLength );  //Something Wrong!!!!!!Creates a new DataView for data at the specified offset
        var result, loc = 0;
        var positions = new Float32Array(header.POINTS*3);
        var colors = new Float32Array(header.POINTS*3);
        var color = new THREE.Color();
        var fView = new Float32Array(body);

        for(var i = 0; i < header.POINTS; i++){
            result = this.binaryReadElement( body, loc, header, little_endian );
            loc += result[ 1 ];
            var element = result[ 0 ];
            positions[3*i] = element.x;
            positions[3*i+1] = element.y;
            positions[3*i+2] = element.z;

            color.setHex(element.rgb.toString(16));
            colors[3*i] = color.r /255;
            colors[3*i+1] = color.g / 255;
            colors[3*i+2] = color.b / 255;
        }

        geometry.addAttribute('position', new THREE.Float32Attribute(positions, 3));
        geometry.addAttribute('color', new THREE.Float32Attribute(colors, 3));

        return this.postProcess( geometry );

    }

};
