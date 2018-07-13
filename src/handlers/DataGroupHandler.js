import { CountryData } from "../countryInfo/CountryData.js";
import { Utils } from "../utils/Utils.js";

function DataGroupHandler ( controller ) {

	var mentionedCache = {};

	function createMentionedCountries () {

		var inputData = controller.inputData;
		var dataSetKeys = inputData.dataSetKeys;
		var initDataSet = inputData.initDataSet;

		for (var i = 0; i < dataSetKeys.length; i++) {

			var key = dataSetKeys[ i ];
			mentionedCache[ key ] = [];
			var data = inputData[ key ];

			for ( var j in data ) {

				var set = data[ j ];

				if ( CountryData[ set.i ] === undefined ) {

					return;

				}

				if ( CountryData[ set.e ] === undefined ) {

					return;

				}

				var importCountryCode = CountryData[ set.i ].colorCode;
				var exportCountryCode = CountryData[ set.e ].colorCode;

				// add mentioned color to controller's mentionedCountryCodes ( an array to store the code )

				if ( mentionedCache[key].indexOf( importCountryCode ) === - 1 ) {

					mentionedCache[key].push( importCountryCode );

				}

				if ( mentionedCache[key].indexOf( exportCountryCode ) === - 1 ) {

					mentionedCache[key].push( exportCountryCode );

				}

			}


		}

		controller.mentionedCountryCodes = mentionedCache[initDataSet];

	}

	function flattenData () {

		var minDataValue = 800000, maxDataValue = 5000000;

		var inputData = controller.inputData;
		var dataSetKeys = inputData.dataSetKeys;

		for ( var i = 0; i < dataSetKeys.length; i++ ) {

			var key = dataSetKeys[ i ];
			var data = inputData[key];

			Utils.flattenCountryData( data, controller.inputValueKey, minDataValue, maxDataValue );

		}

	}

	function createFakeData() {

		var inputData = controller.inputData;
		var dataSetKeys = inputData.dataSetKeys;

		for ( var i = 0; i < dataSetKeys.length; i++ ) {

			var key = dataSetKeys[ i ];
			var data = inputData[ key ];

			for ( var j in data ) {

				var set = data[ j ];
				set.fakeData = set.v;

			}

		}

		controller.inputValueKey = "fakeData";

	}

	function createGeometry () {

		var inputData = controller.inputData;
		var dataSetKeys = inputData.dataSetKeys;

		for ( var i = 0; i < dataSetKeys.length; i++ ) {

			var key = dataSetKeys[ i ];
			var data = inputData[key];

			var vec3_origin = new THREE.Vector3( 0, 0, 0 );

			if ( data === null ) {

				return;

			}

			for ( var s in data ) {

				var set = data[ s ];

				var exporterName = set.e.toUpperCase();
				var importerName = set.i.toUpperCase();

				if (exporterName == "ZZ" || importerName == "ZZ") {
					console.group("ZZ unknown country");
					console.log("ZZ country code detected for current ;countries this will not be print on the globe");
					console.log(exporterName + ", " + importerName);
					console.groupEnd();

					delete data[s];

					continue;
				}

				var exporter = CountryData[ exporterName ];
				var importer = CountryData[ importerName ];

				if (exporter==null) throw exporterName+" is not referenced as a country code! See the full list there : https://github.com/syt123450/giojs/blob/master/src/countryInfo/CountryData.js";
				if (importer==null) throw importerName+" is not referenced as a country code! See the full list there : https://github.com/syt123450/giojs/blob/master/src/countryInfo/CountryData.js";

				set.lineGeometry = makeConnectionLineGeometry( exporter, importer, set.fakeData );

			}

			function makeConnectionLineGeometry ( exporter, importer, value ) {

				var exporterCenter = exporter.center.clone();
				var distanceBetweenCountryCenter = exporterCenter.subVectors( exporterCenter, importer.center ).length();

				var start = exporter.center;
				var end = importer.center;

				var mid = start.clone().lerp( end, 0.5 );
				var midLength = mid.length();
				mid.normalize();
				mid.multiplyScalar( midLength + distanceBetweenCountryCenter * 0.7 );

				var normal = ( new THREE.Vector3() ).subVectors( start, end );
				normal.normalize();

				var distanceHalf = distanceBetweenCountryCenter * 0.5;

				var startAnchor = start;

				var midStartAnchor = mid.clone().add( normal.clone().multiplyScalar( distanceHalf ) );
				var midEndAnchor = mid.clone().add( normal.clone().multiplyScalar( -distanceHalf ) );

				var endAnchor = end;

				var splineCurveA = new THREE.CubicBezierCurve3( start, startAnchor, midStartAnchor, mid );
				var splineCurveB = new THREE.CubicBezierCurve3( mid, midEndAnchor, endAnchor, end );

				var vertexCountDesired = Math.floor( distanceBetweenCountryCenter * 0.02 + 6 ) * 2;

				var points = splineCurveA.getPoints( vertexCountDesired );

				points = points.splice( 0, points.length - 1 );
				points = points.concat( splineCurveB.getPoints( vertexCountDesired ) );
				points.push( vec3_origin );

				var val = value * 0.0003;

				var size = ( 10 + Math.sqrt( val ) );


				size = Utils.constrain( size, 0.1, 60 );

				var curveGeometry = new THREE.Geometry();

				for ( var i = 0; i < points.length; i++ ) {

					curveGeometry.vertices.push( points[ i ] );

				}

				curveGeometry.size = size;

				return curveGeometry;

			}

		}


	}

	function dumpData () {

		var initDataSet = controller.inputData.initDataSet;
		controller.globalData = controller.inputData[ initDataSet ];

	}

	function switchDataSet ( dataSetName ) {

		var dataSetKeys = controller.inputData.dataSetKeys;

		if ( dataSetKeys.indexOf( dataSetName ) !== - 1 ) {

			controller.mentionedCountryCodes = mentionedCache[ dataSetName ];
			controller.globalData = controller.inputData[ dataSetName ];
			controller.visSystemHandler.update();
			controller.surfaceHandler.update();

		}

	}

	return {

		createMentionedCountries: createMentionedCountries,

		flattenData: flattenData,

		createFakeData: createFakeData,

		createGeometry: createGeometry,

		dumpData: dumpData,

		switchDataSet: switchDataSet

	}

}

export { DataGroupHandler }