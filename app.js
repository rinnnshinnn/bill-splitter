import { supabase } from "./supabase.js";

window.addBill = async function () {
  const type = document.getElementById("type").value;
  const amount = Number(document.getElementById("amount").value);
  const paidBy = Number(document.getElementById("paidBy").value);
  const month = document.getElementById("month").value;

  await supabase.from("bills").insert([
    { type, amount, paid_by: paidBy, month }
  ]);

  alert("Bill added");
  calculate();
};

async function calculate() {
  const { data: bills } = await supabase.from("bills").select("*");

  let total = 0;
  let paid = { 1: 0, 2: 0 };

  bills.forEach(b => {
    total += Number(b.amount);
    paid[b.paid_by] += Number(b.amount);
  });

  const fairShare = total / 2;

  document.getElementById("summary").innerHTML = `
    <p>Total bills: ₱${total}</p>
    <p>Each should pay: ₱${fairShare}</p>
    <p>Gab balance: ₱${fairShare - paid[1]}</p>
    <p>Sibling balance: ₱${fairShare - paid[2]}</p>
  `;
}

calculate();
