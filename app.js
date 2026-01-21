import { supabase } from "./supabase.js";

const billTypes = ["rent", "electric", "water", "internet"];
const personIds = { 1: "Gab", 2: "Francine" };

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

// Calculate balances
async function calculate() {
  const bills = await fetchBills();
  if (!bills) return;

  // Initialize per-person data
  const tableData = {
    1: { rent: 0, electric: 0, water: 0, internet: 0 },
    2: { rent: 0, electric: 0, water: 0, internet: 0 },
  };

  const personDebt = { 1: 0, 2: 0 }; // track carryover debt to next bill

  // Sort bills in priority: smaller bills first so debt shifts to rent
  const sortedBills = ["electric", "water", "internet", "rent"];

  sortedBills.forEach(bt => {
    const billRows = bills.filter(b => b.type === bt);

    billRows.forEach(b => {
      const share = b.amount / 2;

      // Calculate initial balances
      if (b.paid_by === 1) {
        // Gab paid
        tableData[1][bt] += 0; // Gab owes 0
        tableData[2][bt] += share; // Francine owes share
      } else {
        tableData[1][bt] += share; // Gab owes share
        tableData[2][bt] += 0; // Francine owes 0
      }
    });

    // Apply debt/credit from previous bill
    tableData[1][bt] -= personDebt[1];
    tableData[2][bt] -= personDebt[2];

    // Calculate new debt/credit to carry over
    let over1 = Math.max(0, -tableData[1][bt]);
    let over2 = Math.max(0, -tableData[2][bt]);

    // Negative balances cannot stay in this bill; move to next (rent last)
    personDebt[1] = over1;
    personDebt[2] = over2;

    // Clip balances at 0 for this bill
    tableData[1][bt] = Math.max(0, tableData[1][bt]);
    tableData[2][bt] = Math.max(0, tableData[2][bt]);
  });

  // After all bills, apply remaining debt to rent
  tableData[1].rent -= personDebt[1];
  tableData[2].rent -= personDebt[2];

  // Calculate totals
  [1,2].forEach(pid => {
    tableData[pid].total = billTypes.reduce((sum, bt) => sum + tableData[pid][bt], 0);
  });

  // Update HTML
  document.getElementById("gabRow").innerHTML = `
    <td>Gab</td>
    <td>${tableData[1].rent.toFixed(2)}</td>
    <td>${tableData[1].electric.toFixed(2)}</td>
    <td>${tableData[1].water.toFixed(2)}</td>
    <td>${tableData[1].internet.toFixed(2)}</td>
    <td>${tableData[1].total.toFixed(2)}</td>
  `;

  document.getElementById("francineRow").innerHTML = `
    <td>Francine</td>
    <td>${tableData[2].rent.toFixed(2)}</td>
    <td>${tableData[2].electric.toFixed(2)}</td>
    <td>${tableData[2].water.toFixed(2)}</td>
    <td>${tableData[2].internet.toFixed(2)}</td>
    <td>${tableData[2].total.toFixed(2)}</td>
  `;
}

// Initial calculation on load
calculate();
