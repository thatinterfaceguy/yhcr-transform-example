var hl72json = require('qewd-hl72json');
var transform = require('qewd-transform-json').transform;
var fs = require('fs');
var uuid = require('uuid')

var hl7 = 'MSH|^~\&|TRAKCARE|RA4|ROUTER|ROUTER|20160308162456||ADT^A08|6z814|P|2.4|||AL|NE|||EN^english^ISO639|';
var hl7 = hl7 +'\n' + 'EVN|A08|20160308155620|||^ ^^^^^^TRAKCARE|20160308155620|';
var hl7 = hl7 +'\n' + 'PID|1|9658218997|000000001^^^RA4^PT||Corr^Lauren^^^Ms^^L||19441228|F|E^White and Black African|NHS Foundation Trust^Yeovil District Hospital^Yeovil^Somerset^BA21 4AT^^P^^^^||||||||||||||||||||||20160308155452|||||';
var hl7 = hl7 +'\n' + 'PD1|||L85015^L85015^|G6683962^MD Wilson^^^^^^^TRAKCARE^^^^DN|||||||||||||||||';
var hl7 = hl7 +'\n' + 'ROL|1|UC|FHCP^Family Health Care Professional|G6683962^MD Wilson^^^^^^^TRAKCARE^^^^DN|||||||Preston Grove Medical Ctr^^^Preston Grove Medical Ctr^BA20 2BQ^^B|^WPN^PH';
var hl7 = hl7 +'\n' + 'NK1|1|Mouse^Minnie^^^^^L|D^Daughter|NHS Foundation Trust^Yeovil District Hospital^Yeovil^Somerset^BA21 4AT^^P^^^^|014126658^PRN^PH^^^^^^P||NOK^Next of Kin|20160308|||||||2||||||||||||||FC||||||||';
var hl7 = hl7 +'\n' + 'PV1|1|I|7B^^^RA430^^^||||ANS^Stewart^Andrew^^^1^^^TRAKCARE^^^^DN~C4258852^Stewart^Andrew^^^1^^^SMC^^^^DN|||100||||19^Usual place of residence|||||I0000000001|||||||||||||||||||||||||20160308155500||||||||';
var hl7 = hl7 +'\n' + 'PV2|||||||||20160308000000|0|||19^Usual place of residence||||||||||||||||||||||||||||||||||';
var hl7 = hl7 +'\n' + 'ROL|1|UC|AT^Attending|ANS^Mr A. Stewart^^^^^^^TRAKCARE^^^^DN|||||||Preston Grove Medical Ctr^^^Preston Grove Medical Ctr^BA20 2BQ^^B|';
var hl7 = hl7 +'\n' + 'OBX|1|ST|DATEMEDICALLYFITFORDISCHARGE^Date medically fit for discharge||20160308000000';
var hl7 = hl7 +'\n' + 'DG1|1||K35.0^Acute appendicitis with generalized peritonitis^ICD10||201030081030|A|||||||||1|C3456789^Darwin^Samuel^^^Dr^^^GMC|D|N|201011291200'
var hl7 = hl7 +'\n' + 'DG1|1||N39.3^Stress Incontinence^ICD10||201010090900|A|||||||||1|C3456789^Darwin^Samuel^^^Dr^^^GMC|D|N|201010090900'
var hl7 = hl7 +'\n' + 'DG1|1||J03.0^Streptococcal tonsillitis^I10||201011072101|F|||||||||1|C3456789^Darwin^Samuel^^^Dr^^^GMC|D|N|201011072110'
var hl7 = hl7 +'\n' + 'IN1|1|11X^NHS SOMERSET CCG|11X|NHS SOMERSET CCG|||||||||||||||||||||||||||||||||||||||||||||';
var hl7 = hl7 +'\n' + 'ZV1|||||PAADMINSURANCE^1_1';
var hl7 = hl7 +'\n' + 'ZWL||||||||||||||||||';

   // convert against HL7 v2.5 dictionary
   var adt = hl72json(hl7, '2.5');
   console.log(JSON.stringify(adt,null,2));

   var encounterResourceTemplate =  
    {
      resourceType: "Encounter",
      meta: {
          lastUpdated: '=> getDate()',
          profile: [
              "https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Encounter-1"
          ]
      },
      identifier: [
          {
              system: "https://fhir.interopen.org/Encounter/Identifier",
              value: '{{PV1[0]["Visit_Number"][0].ID.value}}'
          }
      ],
      status: "finished",
      class: {
          system: "http://hl7.org/fhir/v3/ActCode",
          code: '=> setClassCode(PV1[0]["Patient_Class"].raw)',
          display: '=> setClassDisplay(PV1[0]["Patient_Class"].raw)'
      },
      type: [
          {
              coding: [
                  {
                      system: "http://snomed.info/sct",
                      code: "698314001",
                      display: "Consultation for treatment"
                  }
              ]
          }
      ],
      priority: {
          "coding": [
              {
                  system: "http://hl7.org/fhir/v3/ActPriority",
                  code: "R",
                  display: "routine"
              }
          ]
      },
      subject: {
          reference: '=> setPatientRef(PID[0]["Patient_ID"][0]["ID_Number"]["value"])',
          display: '=> setPatientRefDisplay(PID[0]["Patient_Name"][0]["Family_Name"][0]["Surname"]["value"],PID[0]["Patient_Name"][0]["Given_Name"]["value"],PID[0]["Patient_Name"][0]["Prefix"]["value"])'
      },
      participant: [
          '{{ROL}}',
         {
			type: [{
				coding: [{
					system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
					code: '=> setRoleCode(["Role-ROL"].value)',
					display: '=> setRoleDisplay(["Role-ROL"].value)'
				}]
			}],
			individual: {
				reference: '=> setPractitionerRef(Role_Person[0].ID_Number.value)',
				display: '{{Role_Person[0].Family_Name[0].Surname.value}}'
            }
        }
      ],
      period: {
          start: '{{PV1[0]["Admit_Date_Time"].value}}',
          end: '{{PV1[0]["Discharge_Date_Time"].value}}'
      },
      diagnosis: [
        '{{DG1}}',
        {
            "condition": {
                "reference": '=> setConditionRef(Diagnosis_Code_DG1.value)',
                "display": '=> setConditionDisplay(Diagnosis_Code_DG1.value)'
            }
        }
    ],
      location: [
          '{{PV1[0].Assigned_Patient_Location}}',
          {
              location: {
                  reference: '=> setLocationRef(Point_of_Care.value)',
                  display: '=> setLocationDisplay(Point_of_Care.value)'
              }
          }
      ],
      serviceProvider: {
          reference: '=> setOrganisationRef(PV1[0].Assigned_Patient_Location[0].Facility[0].Namespace_ID.value)',
          display: '=> setOrganisationDisplay(PV1[0].Assigned_Patient_Location[0].Facility[0].Namespace_ID.value)'
      }
    }

    var setClassCode = function(input) {
        if(input === "I") return "IMP";
    }
 
    var setClassDisplay = function(input) {
     if(input === "I") return "inpatient encounter";
     }
 
     var setPatientRef = function(input) {
         //Would require a look up but to translate a patient id to logical resource Id
         return "Patient/" + input;
     }
 
     var setPatientRefDisplay = function(input,input2,input3) {
         return input3 + " " + input2 + " " + input;
     }
 
     var setPractitionerRef = function(input) {
         return "Practitioner/" + input;
     }
 
     var setRoleCode = function(input) {
         var hl7v2Code = input.split("^")[0];
         return hl7v2Code === "AT" ? "ATND" : "PART";
     }
 
     var setRoleDisplay = function(input) {
         var hl7v2Code = input.split("^")[0];
         return hl7v2Code === "AT" ? "attender" : "Participation";
     }
 
     var setConditionRef = function(input) {
         return "Condition/" + input.split("^")[0].replace(".","");
     }
 
     var setConditionDisplay = function(input) {
         return input.split("^")[1];
     }
 
     var setLocationRef = function(input) {
         return "Organization/" + input;
     }
 
     var setLocationDisplay = function(input) {
         return "Ward " + input;
     }
 
     var setOrganisationRef = function(input) {
         return "Organization/" + input;
     }
 
     var setOrganisationDisplay = function(input) {
         return "YEOVIL DISTRICT HOSPITAL NHS FOUNDATION TRUST";
     }

    var encounter = transform(encounterResourceTemplate, adt, {
        setClassCode, 
        setClassDisplay, 
        setPatientRef, 
        setPatientRefDisplay, 
        setPractitionerRef, 
        setRoleCode, 
        setRoleDisplay, 
        setConditionRef,
        setConditionDisplay,
        setLocationRef, 
        setLocationDisplay, 
        setOrganisationRef, 
        setOrganisationDisplay
    });

console.log(JSON.stringify(encounter,null,2));


   
  