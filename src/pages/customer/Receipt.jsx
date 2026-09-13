import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FiArrowLeft,
  FiCheckCircle,
  FiDownload,
  FiLoader,
  FiPackage,
  FiShield,
} from "react-icons/fi";

import { doc, getDoc } from "firebase/firestore";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

import jsPDF from "jspdf";

function Receipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const formatMoney = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG")}`;

  const getTimestamp = (value) => {
    if (!value) return null;

    if (typeof value.toDate === "function") {
      return value.toDate();
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === "number") {
      return new Date(value);
    }

    if (typeof value === "string") {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    if (
      typeof value === "object" &&
      typeof value.seconds === "number"
    ) {
      return new Date(
        value.seconds * 1000 +
          Math.floor(
            Number(value.nanoseconds || 0) / 1000000
          )
      );
    }

    return null;
  };

  const formatDate = (value) => {
    const date = getTimestamp(value);

    if (!date) return "—";

    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (value) => {
    const date = getTimestamp(value);

    if (!date) return "—";

    return date.toLocaleString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      if (!id || !firebaseUser?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const orderRef = doc(db, "orders", String(id));
        const snapshot = await getDoc(orderRef);

        if (cancelled) return;

        if (!snapshot.exists()) {
          setOrder(null);
          setError("This receipt could not be found.");
          setLoading(false);
          return;
        }

        const data = snapshot.data();

        /*
         * Only the buyer or seller belonging to this order
         * should be able to view the receipt.
         */
        const currentUserId = String(firebaseUser.uid);

        const isBuyer =
          String(data.buyerId || "") === currentUserId;

        const isSeller =
          String(data.sellerId || "") === currentUserId;

        if (!isBuyer && !isSeller) {
          setOrder(null);
          setError(
            "You do not have permission to view this receipt."
          );
          setLoading(false);
          return;
        }

        setOrder({
          id: snapshot.id,
          ...data,
        });

        setLoading(false);
      } catch (err) {
        console.error("Receipt loading error:", err);

        if (!cancelled) {
          setError(
            "We could not load this receipt. Please try again."
          );
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [id, firebaseUser?.uid]);

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []),
    [order]
  );

  const orderNumber =
    order?.orderNumber ||
    order?.id ||
    "CampusMart Order";

  const total = Number(order?.total || 0);

  const downloadPDF = async () => {
    if (!order || downloading) return;

    setDownloading(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;

      let y = 20;

      /*
       * HEADER
       */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(0, 130, 54);

      pdf.text("CampusMart", 20, y);

      y += 9;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "normal");

      pdf.text(
        "Official Payment Receipt",
        20,
        y
      );

      y += 12;

      pdf.setDrawColor(0, 130, 54);
      pdf.setLineWidth(0.5);

      pdf.line(
        20,
        y,
        pageWidth - 20,
        y
      );

      y += 12;

      /*
       * PAYMENT SUCCESS
       */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor(30, 30, 30);

      pdf.text(
        "PAYMENT SUCCESSFUL",
        20,
        y
      );

      y += 9;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);

      pdf.text(
        "This receipt confirms that payment for the order below",
        20,
        y
      );

      y += 5;

      pdf.text(
        "was successfully recorded on CampusMart.",
        20,
        y
      );

      y += 13;

      /*
       * ORDER INFORMATION
       */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(0, 130, 54);

      pdf.text("ORDER INFORMATION", 20, y);

      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);

      pdf.text(
        `Order Number: #${orderNumber}`,
        20,
        y
      );

      y += 6;

      pdf.text(
        `Order Date: ${formatDateTime(
          order.createdAt || order.date
        )}`,
        20,
        y
      );

      y += 6;

      pdf.text(
        `Payment Method: ${
          order.paymentMethod || "Paystack"
        }`,
        20,
        y
      );

      y += 6;

      pdf.text(
        `Payment Status: ${
          order.paymentStatus || "paid"
        }`,
        20,
        y
      );

      y += 6;

      if (order.paystackReference) {
        pdf.text(
          `Payment Reference: ${String(
            order.paystackReference
          )}`,
          20,
          y
        );

        y += 6;
      }

      y += 8;

      /*
       * BUYER INFORMATION
       */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(0, 130, 54);

      pdf.text("CUSTOMER INFORMATION", 20, y);

      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);

      pdf.text(
        `Name: ${
          order.customer?.fullName ||
          order.fullName ||
          order.customerName ||
          "CampusMart Customer"
        }`,
        20,
        y
      );

      y += 6;

      if (order.phone) {
        pdf.text(
          `Phone: ${order.phone}`,
          20,
          y
        );

        y += 6;
      }

      if (order.campus) {
        pdf.text(
          `Campus: ${order.campus}`,
          20,
          y
        );

        y += 6;
      }

      if (order.address) {
        const address =
          String(order.address);

        const addressLines =
          pdf.splitTextToSize(
            `Address: ${address}`,
            pageWidth - 40
          );

        pdf.text(
          addressLines,
          20,
          y
        );

        y +=
          addressLines.length * 5 +
          1;
      }

      y += 9;

      /*
       * ITEMS TABLE
       */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(0, 130, 54);

      pdf.text("ORDER ITEMS", 20, y);

      y += 8;

      /*
       * Table header
       */
      pdf.setFillColor(238, 248, 242);
      pdf.rect(
        20,
        y - 5,
        pageWidth - 40,
        9,
        "F"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(40, 40, 40);

      pdf.text("Item", 23, y);
      pdf.text("Qty", 125, y);
      pdf.text("Price", 145, y);
      pdf.text("Total", 177, y);

      y += 10;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);

      items.forEach((item) => {
        if (y > 265) {
          pdf.addPage();
          y = 20;
        }

        const name =
          item?.name ||
          item?.productName ||
          "CampusMart Product";

        const quantity =
          Number(item?.quantity || 1);

        const price = Number(
          String(item?.price ?? 0).replace(
            /₦|,/g,
            ""
          )
        );

        const lineTotal =
          price * quantity;

        const itemLines =
          pdf.splitTextToSize(
            name,
            95
          );

        pdf.text(
          itemLines,
          23,
          y
        );

        pdf.text(
          String(quantity),
          128,
          y
        );

        pdf.text(
          formatMoney(price),
          145,
          y
        );

        pdf.text(
          formatMoney(lineTotal),
          177,
          y
        );

        y += Math.max(
          7,
          itemLines.length * 5
        );

        pdf.setDrawColor(
          225,
          225,
          225
        );

        pdf.line(
          20,
          y - 3,
          pageWidth - 20,
          y - 3
        );
      });

      y += 8;

      /*
       * TOTAL
       */
      pdf.setFillColor(0, 130, 54);

      pdf.roundedRect(
        20,
        y,
        pageWidth - 40,
        18,
        3,
        3,
        "F"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);

      pdf.text(
        "TOTAL PAID",
        27,
        y + 11
      );

      pdf.setFontSize(14);

      pdf.text(
        formatMoney(total),
        pageWidth - 27,
        y + 11,
        {
          align: "right",
        }
      );

      y += 31;

      /*
       * DELIVERY / ORDER STATUS
       */
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 130, 54);

      pdf.text(
        "ORDER STATUS",
        20,
        y
      );

      y += 7;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);

      pdf.text(
        `Current Status: ${String(
          order.status || "pending"
        ).toUpperCase()}`,
        20,
        y
      );

      y += 6;

      pdf.text(
        "Payment has been successfully verified.",
        20,
        y
      );

      y += 13;

      /*
       * FOOTER
       */
      pdf.setDrawColor(
        220,
        220,
        220
      );

      pdf.line(
        20,
        y,
        pageWidth - 20,
        y
      );

      y += 8;

      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.setFont("helvetica", "normal");

      pdf.text(
        "CampusMart 2.0",
        20,
        y
      );

      pdf.text(
        "campusmart1234@gmail.com",
        pageWidth - 20,
        y,
        {
          align: "right",
        }
      );

      y += 5;

      pdf.text(
        "Thank you for shopping on CampusMart.",
        20,
        y
      );

      pdf.text(
        "Always meet in safe public places on campus.",
        pageWidth - 20,
        y,
        {
          align: "right",
        }
      );

      const filename = `CampusMart-Receipt-${String(
        orderNumber
      ).replace(/[^a-zA-Z0-9-_]/g, "")}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error(
        "Receipt PDF generation error:",
        err
      );

      window.alert(
        "CampusMart could not create the PDF receipt. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />

          <p className="mt-4 text-sm text-gray-500">
            Loading your receipt...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-7 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <FiPackage size={28} />
          </div>

          <h1 className="text-xl font-bold text-gray-800 mt-4">
            Receipt unavailable
          </h1>

          <p className="text-sm text-gray-500 mt-2 leading-6">
            {error ||
              "This receipt could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="mt-6 h-11 px-5 rounded-xl bg-[#008236] hover:bg-[#006f2e] text-white font-semibold"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-5 sm:py-10 px-3 sm:px-6">
      {/* TOP BAR */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-10 px-3 sm:px-4 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold flex items-center gap-2 hover:bg-gray-50"
        >
          <FiArrowLeft size={17} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={downloadPDF}
          disabled={downloading}
          className="h-10 px-4 rounded-xl bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-300 text-white font-semibold flex items-center gap-2"
        >
          {downloading ? (
            <>
              <FiLoader
                size={17}
                className="animate-spin"
              />
              Creating PDF...
            </>
          ) : (
            <>
              <FiDownload size={17} />
              Download PDF
            </>
          )}
        </button>
      </div>

      {/* RECEIPT PAPER */}
      <main className="max-w-4xl mx-auto bg-white shadow-xl rounded-sm overflow-hidden">
        {/* HEADER */}
        <div className="px-5 sm:px-10 py-7 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div>
              <h1 className="text-3xl font-black text-[#008236] tracking-tight">
                CampusMart
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Official Payment Receipt
              </p>
            </div>

            <div className="flex items-center gap-2 text-[#008236]">
              <FiCheckCircle size={22} />

              <div>
                <p className="font-bold text-sm">
                  PAYMENT SUCCESSFUL
                </p>

                <p className="text-xs text-gray-500">
                  Verified payment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ORDER INFO */}
        <div className="px-5 sm:px-10 py-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Order number
              </p>

              <p className="mt-1 font-bold text-gray-900">
                #{orderNumber}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Order date
              </p>

              <p className="mt-1 font-semibold text-gray-800">
                {formatDateTime(
                  order.createdAt ||
                    order.date
                )}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Payment method
              </p>

              <p className="mt-1 font-semibold text-gray-800 capitalize">
                {order.paymentMethod ||
                  "Paystack"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Payment status
              </p>

              <span className="inline-flex mt-1 px-2.5 py-1 rounded-full bg-green-100 text-[#008236] text-xs font-bold">
                PAID
              </span>
            </div>
          </div>

          {order.paystackReference && (
            <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                Payment reference
              </p>

              <p className="mt-1 text-xs sm:text-sm font-mono text-gray-700 break-all">
                {order.paystackReference}
              </p>
            </div>
          )}
        </div>

        {/* CUSTOMER */}
        <div className="px-5 sm:px-10 pb-7">
          <div className="rounded-2xl bg-green-50 border border-green-100 p-5">
            <h2 className="text-sm font-bold text-[#008236] uppercase tracking-wide">
              Customer information
            </h2>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">
                  Full name
                </p>

                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {order.customer?.fullName ||
                    order.fullName ||
                    order.customerName ||
                    "CampusMart Customer"}
                </p>
              </div>

              {order.phone && (
                <div>
                  <p className="text-xs text-gray-400">
                    Phone
                  </p>

                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {order.phone}
                  </p>
                </div>
              )}

              {order.campus && (
                <div>
                  <p className="text-xs text-gray-400">
                    Campus
                  </p>

                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {order.campus}
                  </p>
                </div>
              )}

              {order.address && (
                <div>
                  <p className="text-xs text-gray-400">
                    Address
                  </p>

                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {order.address}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="px-5 sm:px-10 pb-8">
          <h2 className="text-lg font-bold text-gray-900">
            Order items
          </h2>

          <div className="mt-4 border border-gray-100 rounded-2xl overflow-hidden">
            {/* DESKTOP HEADER */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_120px_120px] bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <span>Product</span>
              <span>Qty</span>
              <span>Price</span>
              <span className="text-right">
                Total
              </span>
            </div>

            {items.map((item, index) => {
              const price = Number(
                String(
                  item?.price ?? 0
                ).replace(
                  /₦|,/g,
                  ""
                )
              );

              const quantity = Number(
                item?.quantity || 1
              );

              const lineTotal =
                price * quantity;

              return (
                <div
                  key={`${item?.id || index}`}
                  className="px-4 py-4 border-t border-gray-100 first:border-t-0"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_120px] gap-2 sm:gap-4 items-center">
                    <div className="flex items-center gap-3">
                      {item?.image ||
                      item?.imageUrl ? (
                        <img
                          src={
                            item.image ||
                            item.imageUrl
                          }
                          alt={
                            item.name ||
                            "Product"
                          }
                          className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center">
                          <FiPackage
                            size={20}
                          />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 break-words">
                          {item?.name ||
                            item?.productName ||
                            "CampusMart Product"}
                        </p>

                        {item?.sellerName && (
                          <p className="text-xs text-gray-400 mt-1">
                            Seller:{" "}
                            {
                              item.sellerName
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <span className="sm:hidden text-gray-400">
                        Qty:{" "}
                      </span>

                      {quantity}
                    </div>

                    <div className="text-sm text-gray-700 font-medium">
                      <span className="sm:hidden text-gray-400">
                        Price:{" "}
                      </span>

                      {formatMoney(
                        price
                      )}
                    </div>

                    <div className="text-sm font-bold text-gray-900 sm:text-right">
                      <span className="sm:hidden text-gray-400">
                        Total:{" "}
                      </span>

                      {formatMoney(
                        lineTotal
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOTAL */}
        <div className="px-5 sm:px-10 pb-8">
          <div className="rounded-2xl bg-[#008236] p-5 sm:p-6 text-white flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-green-100">
                Total amount paid
              </p>

              <p className="text-xs text-green-100 mt-1">
                {items.reduce(
                  (sum, item) =>
                    sum +
                    Number(
                      item?.quantity || 0
                    ),
                  0
                )}{" "}
                item(s)
              </p>
            </div>

            <p className="text-2xl sm:text-3xl font-black">
              {formatMoney(total)}
            </p>
          </div>
        </div>

        {/* SECURITY */}
        <div className="px-5 sm:px-10 pb-8">
          <div className="flex items-start gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <div className="w-9 h-9 rounded-full bg-green-100 text-[#008236] flex items-center justify-center shrink-0">
              <FiShield size={18} />
            </div>

            <div>
              <p className="text-sm font-bold text-gray-800">
                CampusMart payment receipt
              </p>

              <p className="text-xs text-gray-500 mt-1 leading-5">
                This receipt confirms that payment for
                this order was successfully recorded.
                Keep it for your records.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 px-5 sm:px-10 py-6 text-center">
          <p className="text-sm font-bold text-[#008236]">
            CampusMart 2.0
          </p>

          <p className="text-xs text-gray-400 mt-1">
            campusmart1234@gmail.com
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Thank you for shopping on CampusMart.
          </p>

          <p className="text-[11px] text-gray-400 mt-1">
            Always meet in safe public places on
            campus.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Receipt;