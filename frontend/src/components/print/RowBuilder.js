export const buildRows = (report) => {
  const rows = [];

  if (!report || !report.tests || report.tests.length === 0) {
    return rows;
  }

  const hasCompletedResults = (test) => {
    if (!test.result || test.result.length === 0) return false;
    return test.result.some(res => 
      res.type !== 'section' && res.value !== null && res.value !== undefined && res.value !== ""
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
        test.result.forEach((res) => {
          if (res.type === 'section') {
            rows.push({ type: 'section', content: res.parameter });
          } else {
            rows.push({ type: 'parameter', content: res });
          }
        });
      }
    });
  });

  return rows;
};
