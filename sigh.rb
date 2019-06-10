read, write = IO.pipe

pid = spawn(
  # 'ruby', '-e', 'IO.new(4, 'r').puts "hello world"'
  'ruby', '-e', 'IO.new(4, "w").puts "hello world"',
  4 => write
)
write.close
Process.wait pid
p read.read
