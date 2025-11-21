export const MANIFEST_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
    xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_v1p2"
    xmlns:imsqti="http://www.imsglobal.org/xsd/imsqti_v2p1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p1.xsd http://www.imsglobal.org/xsd/imsmd_v1p2 http://www.imsglobal.org/xsd/imsmd_v1p2p4.xsd http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/imsqti_v2p1.xsd"
    identifier="MANIFEST-QTI-CONVERTER-{{UUID}}">
  <metadata>
    <schema>IMS Content</schema>
    <schemaversion>1.1</schemaversion>
  </metadata>
  <organizations />
  <resources>
    {{RESOURCES}}
  </resources>
</manifest>`;

export const ASSESSMENT_ITEM_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/imsqti_v2p1.xsd"
    identifier="{{ITEM_ID}}"
    title="{{TITLE}}"
    adaptive="false"
    timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>{{CORRECT_RESPONSE_ID}}</value>
    </correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue>
      <value>0</value>
    </defaultValue>
  </outcomeDeclaration>
  <itemBody>
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="true" maxChoices="1">
      <prompt>{{QUESTION_TEXT}}</prompt>
      {{SIMPLE_CHOICES}}
    </choiceInteraction>
  </itemBody>
  <responseProcessing template="http://www.imsglobal.org/xsd/imsqti_v2p1/rptemplates/match_correct" />
</assessmentItem>`;

export const SIMPLE_CHOICE_TEMPLATE = `<simpleChoice identifier="{{CHOICE_ID}}">{{CHOICE_TEXT}}</simpleChoice>`;
