import { supabase } from "./supabase.js";

const billTypes = ["rent", "electric", "water", "internet"];
const personIds = { 1: "Gab", 2: "Francine" };

// Initialize balances for a month
window.initMonth = async function() {
  const month = document.getElementById("monthInit").value;
  if (!month) return alert("Enter month!");

  const amounts = {
    rent: Number(document.getElementById("rentInit").value) || 0,
    electric: Number(document.getElementById("electricInit").value) || 0,
    water: Number(document.getElementById("waterInit").value) || 0,
    internet: Number(document.getElementById("internetInit").value) || 0,
  };

  // Delete existing bills for this month
  await supabase.from("bills").delete().eq("month", month);

  // Insert baseline for each person
  const inserts = [];
  for (const bt of billTypes) {
    const share = amounts[bt] / 2;
    // Gab
    inserts.push({ type: bt, amount: share, paid_by: 0, month });
    // Francine
    inserts.push({ type: bt, amount: share, paid_by: 0, month });
  }

  const { error } = await supabase.from("bills").insert(inserts);
  if (error) console.error(error);

  calculate(month);
};

// Add a payment
window.addPayment = async function() {
  const type = document.getElementById("type").value.toLowerCase();
  const amount = Number(document.getElementById("amount").value);
  const paid_by = Number(document.getElementById("paidBy").value);
  const month = document.getElementById("month").value;

  if (!billTypes.includes(type)) return alert("Bill type must be rent, electric, water, or internet!");
  if (!amount || !month) return alert("Fill all fields!");

  // Fetch balances for this bill/month
  const { data: balances, error } = await supabase
    .from("bills")
    .select("*")
    .eq("month", month)
    .eq("type", type);
  if (error) return console.error(error);

  let remainingPayment = amount;

  // First settle this bill
  for (const b of balances) {
    const bal = b.amount;
    const applied = Math.min(remainingPayment, bal);
    remainingPayment -= applied;

    await supabase
      .from("bills")
      .update({ amount: bal - applied, paid_by: paid_by })
      .eq("id", b.id);
  }

  // If payment leftover, shift to rent
  if (remainingPayment > 0) {
    const { data: rentBalances } = await supabase
      .from("bills")
      .select("*")
      .eq("month", month)
      .eq("type", "rent");

    for (const r of rentBalances) {
      const applied = Math.min(remainingPayment, r.amount);
      remainingPayment -= applied;
      await supabase
        .from("bills")
        .update({ amount: r.amount - applied, paid_by })
        .eq("id", r.id);
      if (remainingPayment <= 0) break;
    }
  }

  calculate(month);
};

// Calculate and display table
async function calculate(monthFilter) {
  const { data: bills, error } = await supabase.from("bills").select("*");
  if (error) return console.error(error);

  const filtered = monthFilter ? bills.filter(b => b.month === monthFilter) : bills;

  const balances = { 1: {}, 2: {} };
  billTypes.forEach(bt => {
    balances[1][bt] = 0;
    balances[2][bt] = 0;
  });

  // Fill balances
  filtered.forEach(b => {
    const pid = b.paid_by || (b.id % 2 === 0 ? 2 : 1); // default to baseline person
    if (pid === 1) balances[1][b.type] += b.amount;
    if (pid === 2) balances[2][b.type] += b.amount;
  });

  // Compute totals
  [1,2].forEach(pid => {
    balances[pid].total = billTypes.reduce((sum, bt) => sum + balances[pid][bt], 0);
  });

  // Update HTML
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

// Initial calculation
calculate();
