export const formatOrderStatus = (status: string): string => {
  switch (status) {
    case "pending":
      return "pending";

    case "confirmed":
      return "confirmed";

    case "preparing":
      return "preparing";

    case "shipping":
      return "shipping";

    case "delivered":
      return "delivered";

    case "cancelled":
      return "cancelled";

    default:
      return status;
  }
};

export const formatOrderStatusColor = (status: string): string => {
  switch (status.trim().toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";

    case "confirmed":
      return "bg-blue-100 text-blue-700 border-blue-200";

    case "preparing":
      return "bg-orange-100 text-orange-700 border-orange-200";

    case "shipping":
      return "bg-purple-100 text-purple-700 border-purple-200";

    case "delivered":
      return "bg-green-100 text-green-700 border-green-200";

    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export const formatDailyProductStatus = (status: string): string => {
  switch (status) {
    case "available":
      return "available";

    case "low_stock":
      return "low_stock";

    case "out_of_stock":
      return "out_of_stock";

    case "draft":
      return "draft";

    case "closed":
      return "closed";

    default:
      return status;
  }
};

export const formatDailyProductStatusColor = (status: string): string => {
  switch (status.trim().toLowerCase()) {
    case "available":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80";

    case "low_stock":
      return "bg-amber-50 text-amber-700 border-amber-200/80";

    case "out_of_stock":
      return "bg-rose-50 text-rose-700 border-rose-200/80";

    case "draft":
      return "bg-slate-100 text-slate-600 border-slate-200";

    case "closed":
      return "bg-red-100 text-red-600 border-red-200";

    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

export const formatOrderType = (orderType: string): string => {
  switch (orderType) {
    case "available":
      return "available";

    case "preorder":
      return "preorder";

    default:
      return orderType;
  }
};

export const formatOrderTypeColor = (orderType: string): string => {
  switch (orderType.trim().toLowerCase()) {
    case "available":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";

    case "preorder":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export const formatStatusBoolean = (status: boolean): string => {
  switch (status) {
    case true:
      return "active";

    case false:
      return "inactive";

    default:
      return status ? "active" : "inactive";
  }
};

export const formatStatusActiveBoolean = (status: boolean): string => {
  switch (status) {
    case true:
      return "active_online";

    case false:
      return "inactive_offline";

    default:
      return status ? "active" : "inactive";
  }
};

export const formatStatusBooleanColor = (status: boolean): string => {
  switch (status) {
    case true:
      return "bg-green-100 text-green-700 border-green-200";

    case false:
      return "bg-red-100 text-red-700 border-red-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export const formatOrderPaymentStatus = (status: string): string => {
  switch (status) {
    case "unpaid":
      return "unpaid";

    case "paid":
      return "paid";

    case "failed":
      return "failed";

    case "refunded":
      return "refunded";

    default:
      return status;
  }
};

export const formatOrderPaymentStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "unpaid":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";

    case "paid":
      return "bg-green-100 text-green-700 border-green-200";

    case "failed":
      return "bg-red-100 text-red-700 border-red-200";

    case "refunded":
      return "bg-purple-100 text-purple-700 border-purple-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};
