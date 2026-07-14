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
      res.type !== 'section' && isValueValid(res.value)
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
              sectionParams.forEach(p => rows.push({ type: p.type || 'parameter', content: p }));
           }
           currentSection = null;
           sectionParams = [];
        };

        test.result.forEach((res) => {
          if (res.type === 'section') {
            commitSection();
            currentSection = res;
          } else {
            if (isValueValid(res.value)) {
               if (currentSection) {
                  sectionParams.push(res);
               } else {
                  rows.push({ type: res.type || 'parameter', content: res });
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
