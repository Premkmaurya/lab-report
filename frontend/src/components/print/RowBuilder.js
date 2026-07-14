export const buildRows = (report) => {
  const rows = [];

  if (!report || !report.tests || report.tests.length === 0) {
    return rows;
  }

  const isValueValid = (val) => {
    return val !== null && val !== undefined && String(val).trim() !== "";
  };

  const hasCompletedResults = (test) => {
    if (!test.result || test.result.length === 0) return false;
    return test.result.some(res => 
      res.type !== 'section' && (isValueValid(res.value) || (res.isTextBlock && isValueValid(res.textBlockValue)))
    );
  };

  // Group tests by department
  const groupedByDept = report.tests.reduce((acc, test) => {
    if (!hasCompletedResults(test)) return acc;

    const dept = test.testId?.departmentId?.name || "GENERAL";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(test);
    return acc;
  }, {});

  Object.entries(groupedByDept).forEach(([department, tests]) => {
    if (tests.length === 0) return;

    rows.push({ type: 'department', content: department, isRepeat: false });

    tests.forEach((test) => {
      rows.push({ type: 'test', content: test.testName || (test.testId && test.testId.name) || "Unnamed Test", isRepeat: false });

      if (test.result && test.result.length > 0) {
        let currentSection = null;
        let sectionParams = [];

        const commitSection = () => {
           if (currentSection && sectionParams.length > 0) {
              rows.push({ type: 'section', content: currentSection.parameter });
              sectionParams.forEach(p => {
                 rows.push({ type: p.type || 'parameter', content: p });
                 if (p.isTextBlock && isValueValid(p.textBlockValue)) {
                    rows.push({ type: 'text_block', content: p });
                 }
              });
           }
           currentSection = null;
           sectionParams = [];
        };

        test.result.forEach((res, resIndex) => {
          const subTestTemplate = test.testId?.subTests?.[resIndex];
          const isTb = res.isTextBlock || res.type === 'text_block' || (subTestTemplate && (subTestTemplate.isTextBlock || subTestTemplate.type === 'text_block'));

          if (res.type === 'section') {
            commitSection();
            currentSection = res;
          } else {
            let val = res.value;
            let tbVal = res.textBlockValue;

            if (isTb) {
               // Legacy report fallback: if textBlockValue is empty and value is populated, use value
               if (!tbVal && res.value) {
                  tbVal = res.value;
                  val = "";
               }
               // Template defaultText fallback
               if (!tbVal && subTestTemplate?.textBlockSettings?.defaultText) {
                  tbVal = subTestTemplate.textBlockSettings.defaultText;
               }
            }

            const hasVal = isValueValid(val);
            const hasTb = isTb && isValueValid(tbVal);

            if (hasVal || hasTb) {
               const resolvedRes = {
                  ...res,
                  value: val,
                  textBlockValue: tbVal,
                  isTextBlock: isTb
               };

               if (currentSection) {
                  sectionParams.push(resolvedRes);
               } else {
                  rows.push({ type: res.type || 'parameter', content: resolvedRes });
                  if (hasTb) {
                     rows.push({ type: 'text_block', content: resolvedRes });
                  }
               }
            }
          }
        });
        
        commitSection();
      }
    });
  });

  return rows;
};
