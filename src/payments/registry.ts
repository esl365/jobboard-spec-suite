export const PaymentsRegistry = {
  list: () => ["mock","iamport"],
  select: (p: string) => ({ charge: async (_o:any)=>({ ok:true, providerId:"test" }) })
};
