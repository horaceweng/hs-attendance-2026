"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function toDateKey(d) {
    var date = new Date(d);
    var y = date.getUTCFullYear();
    var m = String(date.getUTCMonth() + 1).padStart(2, '0');
    var day = String(date.getUTCDate()).padStart(2, '0');
    return "".concat(y, "-").concat(m, "-").concat(day);
}
function debug(dateStr) {
    return __awaiter(this, void 0, void 0, function () {
        var dateKey, leaves, attendanceRecords, attendanceByStudent, _i, attendanceRecords_1, a, key, _a, leaves_1, l, lStart, lEnd, inRange, att, hasAttendanceToday;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    dateKey = toDateKey(dateStr);
                    console.log("Debugging leave/attendance matching for date: ".concat(dateKey));
                    return [4 /*yield*/, prisma.leaveRequest.findMany({
                            where: {
                                OR: [
                                    { status: 'pending' },
                                    { status: 'approved' },
                                ],
                                startDate: { lte: new Date(dateStr) },
                                endDate: { gte: new Date(dateStr) },
                            },
                            include: { student: true, leaveType: true },
                        })];
                case 1:
                    leaves = _b.sent();
                    console.log("Found ".concat(leaves.length, " leaveRequests overlapping ").concat(dateKey));
                    return [4 /*yield*/, prisma.attendanceRecord.findMany({
                            where: {
                                attendanceDate: new Date(dateStr),
                            },
                            include: { student: true, leaveType: true },
                        })];
                case 2:
                    attendanceRecords = _b.sent();
                    console.log("Found ".concat(attendanceRecords.length, " attendanceRecords for ").concat(dateKey));
                    attendanceByStudent = {};
                    for (_i = 0, attendanceRecords_1 = attendanceRecords; _i < attendanceRecords_1.length; _i++) {
                        a = attendanceRecords_1[_i];
                        key = toDateKey(a.attendanceDate);
                        attendanceByStudent[a.studentId] = attendanceByStudent[a.studentId] || [];
                        attendanceByStudent[a.studentId].push({ key: key, record: a });
                    }
                    for (_a = 0, leaves_1 = leaves; _a < leaves_1.length; _a++) {
                        l = leaves_1[_a];
                        lStart = toDateKey(l.startDate);
                        lEnd = toDateKey(l.endDate);
                        inRange = dateKey >= lStart && dateKey <= lEnd;
                        att = attendanceByStudent[l.studentId] || [];
                        hasAttendanceToday = att.some(function (a) { return a.key === dateKey; });
                        console.log('---');
                        console.log("Leave id: ".concat(l.id, ", student: ").concat(l.student.name, " (").concat(l.studentId, "), status: ").concat(l.status));
                        console.log("raw start: ".concat(l.startDate.toISOString(), ", raw end: ").concat(l.endDate.toISOString()));
                        console.log("normalized start: ".concat(lStart, ", normalized end: ").concat(lEnd, ", inRange: ").concat(inRange));
                        console.log("attendance records for student today: ".concat(hasAttendanceToday ? att.filter(function (a) { return a.key === dateKey; }).map(function (x) { return x.record.id; }).join(',') : 'none'));
                    }
                    return [4 /*yield*/, prisma.$disconnect()];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var argvDate = process.argv[2] || new Date().toISOString().split('T')[0];
debug(argvDate).catch(function (err) { console.error(err); prisma.$disconnect(); process.exit(1); });
