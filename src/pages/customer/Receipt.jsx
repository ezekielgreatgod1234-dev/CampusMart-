import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FiArrowLeft,
  FiCheckCircle,
  FiDownload,
  FiLoader,
  FiPackage,
  FiShield,
  FiX,
  FiExternalLink,
  FiRefreshCw,
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
  const [error, setError] = useState("");
  const [viewerRole, setViewerRole] = useState(null);

  // Download UI state (CampusMart modal — not browser chrome)
  const [downloadStatus, setDownloadStatus] = useState("idle"); // idle | loading | done | error
  const [downloadError, setDownloadError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const formatMoney = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG")}`;

  const formatMoneyPdf = (amount) =>
    `NGN ${Number(amount || 0).toLocaleString("en-NG")}`;

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
          Math.floor(Number(value.nanoseconds || 0) / 1000000)
      );
    }

    return null;
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
        if (!firebaseUser?.uid) {
          setError("Please sign in to view this receipt.");
        }
        return;
      }

      setLoading(true);
      setError("");
      setViewerRole(null);

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

        const data = snapshot.data() || {};
        const currentUserId = String(firebaseUser.uid);

        const buyerId = String(data.buyerId || "");
        const sellerId = String(
          data.sellerId ||
            data.sellerUid ||
            data.seller?.uid ||
            ""
        );

        const itemSellerIds = Array.isArray(data.items)
          ? data.items
              .map(
                (item) =>
                  item?.sellerId ||
                  item?.sellerUid ||
                  item?.seller?.uid ||
                  ""
              )
              .filter(Boolean)
              .map(String)
          : [];

        const isBuyer = buyerId === currentUserId;
        const isSeller =
          sellerId === currentUserId ||
          itemSellerIds.includes(currentUserId);

        if (!isBuyer && !isSeller) {
          setOrder(null);
          setError(
            "You do not have permission to view this receipt."
          );
          setLoading(false);
          return;
        }

        setViewerRole(isSeller && !isBuyer ? "seller" : "buyer");
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

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []),
    [order]
  );

  const orderNumber =
    order?.orderNumber || order?.id || "CampusMart Order";

  const total = Number(
    order?.total ?? order?.amount ?? order?.amountPaid ?? 0
  );

  const buildPdfBlob = () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const left = 18;
    const right = pageWidth - 18;
    const contentWidth = right - left;

    const colItem = left + 2;
    const colQty = 118;
    const colPriceRight = 155;
    const colTotalRight = right - 2;

    let y = 18;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(0, 130, 54);
    pdf.text("CampusMart", left, y);

    y += 7;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont("helvetica", "normal");
    pdf.text("Official Payment Receipt", left, y);

    y += 10;

    pdf.setDrawColor(0, 130, 54);
    pdf.setLineWidth(0.6);
    pdf.line(left, y, right, y);

    y += 10;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(30, 30, 30);
    pdf.text(
      viewerRole === "seller"
        ? "PAYMENT RECEIVED"
        : "PAYMENT SUCCESSFUL",
      left,
      y
    );

    y += 7;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);

    const intro =
      viewerRole === "seller"
        ? "This receipt confirms that the buyer has paid for the order below on CampusMart."
        : "This receipt confirms that payment for the order below was successfully recorded on CampusMart.";

    const introLines = pdf.splitTextToSize(intro, contentWidth);
    pdf.text(introLines, left, y);
    y += introLines.length * 4.5 + 8;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(0, 130, 54);
    pdf.text("ORDER INFORMATION", left, y);

    y += 7;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);

    const orderInfo = [
      `Order Number: #${orderNumber}`,
      `Order Date: ${formatDateTime(order.createdAt || order.date)}`,
      `Payment Method: ${order.paymentMethod || "Paystack"}`,
      `Payment Status: ${order.paymentStatus || "paid"}`,
    ];

    if (order.paystackReference) {
      orderInfo.push(
        `Payment Reference: ${String(order.paystackReference)}`
      );
    }

    orderInfo.forEach((line) => {
      const lines = pdf.splitTextToSize(line, contentWidth);
      pdf.text(lines, left, y);
      y += lines.length * 4.5 + 1.5;
    });

    y += 6;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(0, 130, 54);
    pdf.text("CUSTOMER INFORMATION", left, y);

    y += 7;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);

    const customerLines = [
      `Name: ${
        order.customer?.fullName ||
        order.fullName ||
        order.customerName ||
        "CampusMart Customer"
      }`,
    ];

    if (order.phone) {
      customerLines.push(`Phone: ${order.phone}`);
    }

    if (order.campus) {
      customerLines.push(`Campus: ${order.campus}`);
    }

    if (order.address) {
      customerLines.push(`Address: ${String(order.address)}`);
    }

    customerLines.forEach((line) => {
      const lines = pdf.splitTextToSize(line, contentWidth);
      pdf.text(lines, left, y);
      y += lines.length * 4.5 + 1.5;
    });

    y += 7;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(0, 130, 54);
    pdf.text("ORDER ITEMS", left, y);

    y += 6;

    const headerH = 8;
    pdf.setFillColor(238, 248, 242);
    pdf.rect(left, y - 5, contentWidth, headerH, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(40, 40, 40);

    pdf.text("Item", colItem, y);
    pdf.text("Qty", colQty, y, { align: "center" });
    pdf.text("Price", colPriceRight, y, { align: "right" });
    pdf.text("Total", colTotalRight, y, { align: "right" });

    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(40, 40, 40);

    items.forEach((item) => {
      if (y > 260) {
        pdf.addPage();
        y = 20;
      }

      const name =
        item?.name || item?.productName || "CampusMart Product";
      const quantity = Number(item?.quantity || 1);
      const price = Number(
        String(item?.price ?? 0).replace(/₦|,/g, "")
      );
      const lineTotal = price * quantity;

      const nameMaxWidth = colQty - colItem - 8;
      const nameLines = pdf.splitTextToSize(name, nameMaxWidth);

      pdf.text(nameLines, colItem, y);
      pdf.text(String(quantity), colQty, y, { align: "center" });
      pdf.text(formatMoneyPdf(price), colPriceRight, y, {
        align: "right",
      });
      pdf.text(formatMoneyPdf(lineTotal), colTotalRight, y, {
        align: "right",
      });

      y += Math.max(6, nameLines.length * 4.2) + 2;

      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.2);
      pdf.line(left, y - 1.5, right, y - 1.5);
    });

    y += 8;

    if (y > 250) {
      pdf.addPage();
      y = 20;
    }

    const totalBarH = 16;
    pdf.setFillColor(0, 130, 54);
    pdf.roundedRect(left, y, contentWidth, totalBarH, 2.5, 2.5, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text("TOTAL PAID", left + 6, y + 10);

    pdf.setFontSize(12);
    pdf.text(formatMoneyPdf(total), right - 6, y + 10, {
      align: "right",
    });

    y += totalBarH + 10;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(0, 130, 54);
    pdf.text("ORDER STATUS", left, y);

    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(
      `Current Status: ${String(order.status || "pending").toUpperCase()}`,
      left,
      y
    );
    y += 5;
    pdf.text("Payment has been successfully verified.", left, y);

    y += 10;

    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(left, y, right, y);

    y += 6;

    pdf.setFontSize(7.5);
    pdf.setTextColor(120, 120, 120);
    pdf.setFont("helvetica", "normal");

    pdf.text("CampusMart 2.0", left, y);
    pdf.text("campusmart1234@gmail.com", right, y, {
      align: "right",
    });

    y += 4.5;

    pdf.text("Thank you for shopping on CampusMart.", left, y);
    pdf.text(
      "Always meet in safe public places on campus.",
      right,
      y,
      { align: "right" }
    );

    return pdf.output("blob");
  };

  const triggerFileDownload = (url, filename) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadPDF = async () => {
    if (!order || downloadStatus === "loading") return;

    setShowDownloadModal(true);
    setDownloadStatus("loading");
    setDownloadError("");

    try {
      // Small delay so the CampusMart modal is visible
      await new Promise((r) => setTimeout(r, 400));

      const blob = buildPdfBlob();
      const filename = `CampusMart-Receipt-${String(orderNumber).replace(
        /[^a-zA-Z0-9-_]/g,
        ""
      )}.pdf`;

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfFileName(filename);

      // Still saves to device (browser bar may appear — unavoidable)
      triggerFileDownload(url, filename);

      setDownloadStatus("done");
    } catch (err) {
      console.error("Receipt PDF generation error:", err);
      setDownloadError(
        "CampusMart could not create the PDF receipt. Please try again."
      );
      setDownloadStatus("error");
    }
  };

  const openPdfInNewTab = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const downloadAgain = () => {
    if (!pdfUrl || !pdfFileName) {
      downloadPDF();
      return;
    }
    triggerFileDownload(pdfUrl, pdfFileName);
  };

  const closeDownloadModal = () => {
    setShowDownloadModal(false);
    if (downloadStatus === "error") {
      setDownloadStatus("idle");
      setDownloadError("");
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
            {error || "This receipt could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 h-11 px-5 rounded-xl bg-[#008236] hover:bg-[#006f2e] text-white font-semibold"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isSellerView = viewerRole === "seller";

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
          disabled={downloadStatus === "loading"}
          className="h-10 px-4 rounded-xl bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-300 text-white font-semibold flex items-center gap-2"
        >
          {downloadStatus === "loading" ? (
            <>
              <FiLoader size={17} className="animate-spin" />
              Creating PDF...
            </>
          ) : (
            <>
              <FiDownload size={17} />
              Download Reciept
            </>
          )}
        </button>
      </div>

      {/* RECEIPT PAPER */}
      <main className="max-w-4xl mx-auto bg-white shadow-xl rounded-sm overflow-hidden">
        <div className="px-5 sm:px-10 py-7 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div>
              <h1 className="text-3xl font-black text-[#008236] tracking-tight">
                CampusMart
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Official Payment Receipt
              </p>
              {isSellerView && (
                <p className="text-xs text-green-700 mt-2 font-medium">
                  Shared with you by the buyer
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 text-[#008236]">
              <FiCheckCircle size={22} />
              <div>
                <p className="font-bold text-sm">
                  {isSellerView
                    ? "PAYMENT RECEIVED"
                    : "PAYMENT SUCCESSFUL"}
                </p>
                <p className="text-xs text-gray-500">
                  Verified payment
                </p>
              </div>
            </div>
          </div>
        </div>

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
                {formatDateTime(order.createdAt || order.date)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Payment method
              </p>
              <p className="mt-1 font-semibold text-gray-800 capitalize">
                {order.paymentMethod || "Paystack"}
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

        <div className="px-5 sm:px-10 pb-7">
          <div className="rounded-2xl bg-green-50 border border-green-100 p-5">
            <h2 className="text-sm font-bold text-[#008236] uppercase tracking-wide">
              Customer information
            </h2>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Full name</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {order.customer?.fullName ||
                    order.fullName ||
                    order.customerName ||
                    "CampusMart Customer"}
                </p>
              </div>

              {order.phone && (
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {order.phone}
                  </p>
                </div>
              )}

              {order.campus && (
                <div>
                  <p className="text-xs text-gray-400">Campus</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {order.campus}
                  </p>
                </div>
              )}

              {order.address && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1 break-words">
                    {order.address}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-10 pb-8">
          <h2 className="text-lg font-bold text-gray-900">
            Order items
          </h2>

          <div className="mt-4 border border-gray-100 rounded-2xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_64px_110px_110px] bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <span>Product</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Price</span>
              <span className="text-right">Total</span>
            </div>

            {items.map((item, index) => {
              const price = Number(
                String(item?.price ?? 0).replace(/₦|,/g, "")
              );
              const quantity = Number(item?.quantity || 1);
              const lineTotal = price * quantity;

              return (
                <div
                  key={`${item?.id || index}`}
                  className="px-4 py-4 border-t border-gray-100 first:border-t-0"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_64px_110px_110px] gap-2 sm:gap-3 items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      {item?.image || item?.imageUrl ? (
                        <img
                          src={item.image || item.imageUrl}
                          alt={item.name || "Product"}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center shrink-0">
                          <FiPackage size={20} />
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
                            Seller: {item.sellerName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 sm:text-center">
                      <span className="sm:hidden text-gray-400">
                        Qty:{" "}
                      </span>
                      {quantity}
                    </div>

                    <div className="text-sm text-gray-700 font-medium sm:text-right tabular-nums">
                      <span className="sm:hidden text-gray-400">
                        Price:{" "}
                      </span>
                      {formatMoney(price)}
                    </div>

                    <div className="text-sm font-bold text-gray-900 sm:text-right tabular-nums">
                      <span className="sm:hidden text-gray-400">
                        Total:{" "}
                      </span>
                      {formatMoney(lineTotal)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 sm:px-10 pb-8">
          <div className="rounded-2xl bg-[#008236] p-5 sm:p-6 text-white flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-green-100">
                Total amount paid
              </p>
              <p className="text-xs text-green-100 mt-1">
                {items.reduce(
                  (sum, item) => sum + Number(item?.quantity || 0),
                  0
                )}{" "}
                item(s)
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-black tabular-nums shrink-0">
              {formatMoney(total)}
            </p>
          </div>
        </div>

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
                {isSellerView
                  ? "This receipt confirms that the buyer has paid for this order. You can download it for your records."
                  : "This receipt confirms that payment for this order was successfully recorded. Keep it for your records."}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 sm:px-10 py-6 text-center">
          <p className="text-sm font-bold text-[#008236]">
            CampusMart 2.0
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Thank you for shopping on CampusMart.
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Always meet in safe public places on campus.
          </p>
        </div>
      </main>

      {/* =====================================================
          CAMPUSMART DOWNLOAD MODAL
         ===================================================== */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (downloadStatus !== "loading") closeDownloadModal();
            }}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[#008236] px-6 py-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  {downloadStatus === "done" ? (
                    <FiCheckCircle size={22} className="text-white" />
                  ) : downloadStatus === "error" ? (
                    <FiX size={22} className="text-white" />
                  ) : (
                    <FiDownload size={22} className="text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">
                    {downloadStatus === "loading" && "Preparing PDF"}
                    {downloadStatus === "done" && "Download ready"}
                    {downloadStatus === "error" && "Download failed"}
                    {downloadStatus === "idle" && "Download receipt"}
                  </h3>
                  <p className="text-xs text-green-100 mt-0.5">
                    CampusMart official receipt
                  </p>
                </div>
              </div>

              {downloadStatus !== "loading" && (
                <button
                  type="button"
                  onClick={closeDownloadModal}
                  className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white shrink-0"
                >
                  <FiX size={20} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {downloadStatus === "loading" && (
                <div className="text-center py-2">
                  <div className="w-12 h-12 mx-auto rounded-full border-4 border-green-100 border-t-[#008236] animate-spin" />
                  <p className="mt-4 text-sm font-semibold text-gray-800">
                    Creating your CampusMart receipt…
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Please wait a moment.
                  </p>
                  <div className="mt-4 h-2 rounded-full bg-green-100 overflow-hidden">
                    <div className="h-full w-2/3 rounded-full bg-[#008236] animate-pulse" />
                  </div>
                </div>
              )}

              {downloadStatus === "done" && (
                <div>
                  <div className="rounded-xl bg-green-50 border border-green-100 p-4 flex gap-3">
                    <FiCheckCircle
                      className="text-[#008236] shrink-0 mt-0.5"
                      size={18}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#008236]">
                        PDF created successfully
                      </p>
                      <p className="text-xs text-gray-500 mt-1 break-all">
                        {pdfFileName || "CampusMart receipt"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                    Your receipt was saved to your device. You can open it in a
                    new tab or download it again.
                  </p>

                  <div className="mt-5 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={openPdfInNewTab}
                      className="h-11 rounded-xl bg-[#008236] hover:bg-[#006f2e] text-white text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <FiExternalLink size={16} />
                      Open PDF in new tab
                    </button>

                    <button
                      type="button"
                      onClick={downloadAgain}
                      className="h-11 rounded-xl border border-green-200 text-[#008236] text-sm font-semibold hover:bg-green-50 flex items-center justify-center gap-2"
                    >
                      <FiRefreshCw size={16} />
                      Download again
                    </button>

                    <button
                      type="button"
                      onClick={closeDownloadModal}
                      className="h-11 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {downloadStatus === "error" && (
                <div>
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
                    {downloadError || "Something went wrong."}
                  </div>
                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={closeDownloadModal}
                      className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={downloadPDF}
                      className="flex-1 h-11 rounded-xl bg-[#008236] text-white text-sm font-semibold"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Receipt;