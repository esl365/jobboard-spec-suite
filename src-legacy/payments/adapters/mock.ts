export const MockAdapter = {
  verifyWebhook: async (_payload:any)=>({ ok:true, eventUid:"evt_mock_1", type:"payment.completed" })
};
