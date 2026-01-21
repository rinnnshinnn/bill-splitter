import { supabase } from "./supabase.js";

const billTypes = ["rent", "electric", "water", "internet"];
const personIds = { 1: "Gab", 2: "Francine" };

// Initial fetch of bills from DB
async function fetchBills() {
  const { data: bills, error } = await supabase.from("bills").select("*");
  if (error) return console.error(error);
  return bills || [];
}

// Add a bill
window.addBill = async function() {
  const type = document.getElementById("type").value.toLowerCase();
  const amount = Number(document.getElementById("amount").value);
  const paid_by = Number(document.getElementById("paidBy").value);
  const month = document.getElementById("month").value;

  if (!billTypes.includes(type)) return alert("Bill type must be rent, electric, water, or internet!");
  if (!amount || !month) return alert("Fill all fields!");

  // Insert into database
  const { error } = await supabase.from("bills").insert([{ type, amount, paid_by, month }]);
  if (error) return console.error(error);

  document.getElementById("type").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("month").value = "";

  calculate();
};

// Calculate balances with overpayment/debt shifting
async function calculate() {
  const bills = await fetchBills();
  if (!bills) return;

  // Step 1: Initialize balances per person
  const balances = {
    1: { rent: 0, electric: 0, water: 0, internet: 0 },
    2: { rent: 0, electric: 0, water: 0, internet: 0 },
  };

  // Step 2: Sum all bills
  bills.forEach(b => {
    const share = b.amount / 2;
    if (b.paid_by === 1) {
      balances[1][b.type] += 0; // Gab paid → owes nothing
      balances[2][b.type] += share; // Francine owes her share
    } else {
      balances[1][b.type] += share; // Gab owes her share
      balances[2][b.type] += 0; // Francine paid → owes nothing
    }
  });

  // Step 3: Apply payments per bill to settle and shift debt/overpayment to rent
  billTypes.forEach(bt => {
    // Total owed for this bill
    const total = balances[1][bt] + balances[2][bt];

    if (total === 0) return; // Nothing owed, skip

    // Payments made from DB
    const payments = bills.filter(b => b.type === bt);
    payments.forEach(p => {
      let paymentAmount = p.amount;

      // Cover the other person's balance first
      const other = p.paid_by === 1 ? 2 : 1;
      const otherBalance = balances[other][bt];
      const appliedToOther = Math.min(paymentAmount, otherBalance);
      balances[other][bt] -= appliedToOther;
      paymentAmount -= appliedToOther;

      // Then cover payer's own balance
      const selfBalance = balances[p.paid_by][bt];
      const appliedToSelf = Math.min(paymentAmount, selfBalance);
      balances[p.paid_by][bt] -= appliedToSelf;
      paymentAmount -= appliedToSelf;

      // Any leftover overpayment shifts to rent
      balances[p.paid_by].rent -= paymentAmount; // decrease their rent
      balances[other].rent += paymentAmount; // increase the other rent
    });

    // Clip negatives to zero (bill settled)
    balances[1][bt] = Math.max(0, balances[1][bt]);
    balances[2][bt] = Math.max(0, balances[2][bt]);
  });

  // Step 4: Calculate totals
  [1,2].forEach(pid => {
    balances[pid].total = billTypes.reduce((sum, bt) => sum + balances[pid][bt], 0);
  });

  // Step 5: Update table
  document.getElementById("gabRow").innerHTML = `
    <td>Gab</td>
    <td>${balances[1].rent.toFixed(2)}</td>
    <td>${balances[1].electric.toFixed(2)}</td>
    <td>${balances[1].water.toFixed(2)}</td>
    <td>${balances[1].internet.toFixed(2)}</td>
    <td>${balances[1].total.toFixed(2)}</td>
  `;

  document.getElementById("francineRow").innerHTML = `
    <td>Francine</td>
    <td>${balances[2].rent.toFixed(2)}</td>
    <td>${balances[2].electric.toFixed(2)}</td>
    <td>${balances[2].water.toFixed(2)}</td>
    <td>${balances[2].internet.toFixed(2)}</td>
    <td>${balances[2].total.toFixed(2)}</td>
  `;
}

// Initial calculation on load
calculate();
